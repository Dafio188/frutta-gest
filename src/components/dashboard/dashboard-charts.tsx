"use client"

import { motion } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1']

interface ChartsProps {
  data: {
    revenueData: any[]
    topCustomers: any[]
    topProducts: any[]
  }
}

export function DashboardCharts({ data }: ChartsProps) {
  const { revenueData, topCustomers, topProducts } = data

  const CustomTooltipRevenue = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border/50 rounded-xl p-3 shadow-xl">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border/50 rounded-xl p-3 shadow-xl">
          <p className="font-medium text-sm text-muted-foreground">{payload[0].name}</p>
          <p className="font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div variants={fadeUp} className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Andamento Fatturato</CardTitle>
            <CardDescription>Fatturato e crediti da incassare negli ultimi 6 mesi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4 text-xs font-sans">
              {revenueData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `€${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`} />
                    <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} content={<CustomTooltipRevenue />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                    <Bar dataKey="Fatturato" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Da Incassare" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Dati non sufficienti</div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-col gap-6">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Migliori Clienti (3 Mesi)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[140px] w-full text-xs font-sans">
              {topCustomers?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topCustomers} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                      {topCustomers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltipPie />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Nessun dato</div>
              )}
            </div>
            <div className="mt-2 space-y-1.5">
              {topCustomers?.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="font-medium shrink-0 ml-2">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Prodotti (3 Mesi)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-3 mt-1">
              {topProducts?.slice(0, 5).map((item, i) => {
                const maxVal = Math.max(...topProducts.map(p => p.value));
                const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate pr-2">{item.name}</span>
                      <span className="text-muted-foreground tabular-nums shrink-0">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
              {(!topProducts || topProducts.length === 0) && (
                <div className="text-xs text-muted-foreground text-center py-4">Nessun dato</div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
