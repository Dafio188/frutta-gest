// src/lib/tenant-db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { masterDb } from './master-db';

/**
 * Gestore delle connessioni ai database dei tenant.
 * Mantiene un pool di PrismaClient caricati dinamicamente.
 */
class TenantDbManager {
  private clients: Map<string, PrismaClient> = new Map();

  /**
   * Ottiene il client Prisma per un'organizzazione specifica.
   * Se non esiste, lo crea recuperando la connection string dal Master DB.
   */
  async getClient(organizationId: string): Promise<PrismaClient> {
    if (this.clients.has(organizationId)) {
      return this.clients.get(organizationId)!;
    }

    const organization = await masterDb.organization.findUnique({
      where: { id: organizationId },
      select: { dbUrl: true, isActive: true, slug: true },
    });

    if (!organization || !organization.isActive) {
      throw new Error(`Organizzazione non trovata o non attiva: ${organizationId}`);
    }

    // Estraiamo il nome dello schema dalla dbUrl
    const dbUrl = organization.dbUrl;
    const schemaMatch = dbUrl.match(/schema=([^&]+)/);
    const schemaName = schemaMatch ? schemaMatch[1] : organization.slug;

    const pool = new pg.Pool({ connectionString: dbUrl });
    
    // FONDAMENTALE FORZARE LA RICERCA SULLO SCHEMA CORRETTO:
    // pg.Pool ignora nativamente il parametro ?schema= della URL!
    pool.on('connect', (client) => {
      client.query(`SET search_path TO "${schemaName}"`);
    });

    const adapter = new PrismaPg(pool as any);

    const client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    } as any);

    this.clients.set(organizationId, client);
    return client;
  }

  /**
   * Chiude tutte le connessioni nel pool. Utile per cleanup o shutdown.
   */
  async disconnectAll() {
    for (const client of this.clients.values()) {
      await client.$disconnect();
    }
    this.clients.clear();
  }
}

// Singleton per il gestore dei tenant
export const tenantDbManager = new TenantDbManager();

/**
 * Shortcut per ottenere il DB del tenant corrente nel flusso di esecuzione.
 * Richiede che l'ID dell'organizzazione sia stato iniettato nel contesto.
 */
export async function getTenantDb(organizationId: string) {
  return tenantDbManager.getClient(organizationId);
}
