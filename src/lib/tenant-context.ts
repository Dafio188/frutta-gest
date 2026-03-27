// src/lib/tenant-context.ts
import { headers } from 'next/headers';
import { masterDb } from './master-db';
import { getTenantDb } from './tenant-db';

/**
 * Recupera lo slug del tenant corrente dagli header iniettati dal middleware.
 */
export async function getTenantSlug(): Promise<string> {
  const headerList = await headers();
  const tenantSlug = headerList.get('X-Tenant-Slug');
  
  if (!tenantSlug) {
    return process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'master';
  }
  
  return tenantSlug;
}

/**
 * Recupera l'oggetto Organization completo dal Master DB basandosi sullo slug corrente.
 */
export async function getCurrentOrganization() {
  const slug = await getTenantSlug();
  
  // Se siamo sul dominio master, restituiamo un oggetto virtuale o cerchiamo nel DB Master
  if (slug === 'master') {
    return {
      id: 'master',
      name: 'Master Control',
      slug: 'master',
      isActive: true,
    };
  }

  return masterDb.organization.findUnique({
    where: { slug },
  });
}

/**
 * Utility "all-in-one" per ottenere il client database del tenant corrente.
 */
export async function getCurrentDb() {
  const slug = await getTenantSlug();
  
  // Se siamo su 'master', restituiamo il client Master DB che ora ha la tabella User
  if (slug === 'master') {
    return masterDb as any;
  }

  const org = await masterDb.organization.findUnique({
    where: { slug },
  });
  
  if (!org) {
    throw new Error(`Contesto tenant non identificato per lo slug: ${slug}`);
  }

  return getTenantDb(org.id);
}
