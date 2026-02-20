/**
 * Order Store - Zustand
 *
 * Gestisce lo stato del carrello/draft dell'ordine durante la creazione.
 */

import { create } from "zustand"

interface OrderItemDraft {
  id: string
  productId: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
  lineTotal: number
  notes: string
}

interface OrderDraftState {
  customerId: string
  customerName: string
  channel: string
  requestedDeliveryDate: string
  notes: string
  internalNotes: string
  items: OrderItemDraft[]

  setCustomer: (id: string, name: string) => void
  setChannel: (channel: string) => void
  setDeliveryDate: (date: string) => void
  setNotes: (notes: string) => void
  setInternalNotes: (notes: string) => void
  addItem: (item: Omit<OrderItemDraft, "id" | "lineTotal">) => void
  updateItem: (id: string, data: Partial<OrderItemDraft>) => void
  removeItem: (id: string) => void
  clearOrder: () => void
  getSubtotal: () => number
  getVatAmount: () => number
  getTotal: () => number
}

export const useOrderStore = create<OrderDraftState>((set, get) => ({
  customerId: "",
  customerName: "",
  channel: "MANUAL",
  requestedDeliveryDate: "",
  notes: "",
  internalNotes: "",
  items: [],

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setChannel: (channel) => set({ channel }),
  setDeliveryDate: (date) => set({ requestedDeliveryDate: date }),
  setNotes: (notes) => set({ notes }),
  setInternalNotes: (notes) => set({ internalNotes: notes }),

  addItem: (item) => {
    const id = Math.random().toString(36).substring(2, 9)
    const lineTotal = item.quantity * item.unitPrice
    set((s) => ({
      items: [...s.items, { ...item, id, lineTotal }],
    }))
  },

  updateItem: (id, data) => {
    set((s) => ({
      items: s.items.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, ...data }
        updated.lineTotal = updated.quantity * updated.unitPrice
        return updated
      }),
    }))
  },

  removeItem: (id) => {
    set((s) => ({ items: s.items.filter((item) => item.id !== id) }))
  },

  clearOrder: () =>
    set({
      customerId: "",
      customerName: "",
      channel: "MANUAL",
      requestedDeliveryDate: "",
      notes: "",
      internalNotes: "",
      items: [],
    }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.lineTotal, 0)
  },

  getVatAmount: () => {
    return get().items.reduce(
      (sum, item) => sum + (item.lineTotal * item.vatRate) / 100,
      0
    )
  },

  getTotal: () => {
    return get().getSubtotal() + get().getVatAmount()
  },
}))
