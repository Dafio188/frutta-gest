export const BASE_CATEGORIES = [
  { name: "Frutta", slug: "frutta", type: "FRUTTA", sortOrder: 1 },
  { name: "Verdura", slug: "verdura", type: "VERDURA", sortOrder: 2 },
  { name: "Ortaggi", slug: "ortaggi", type: "ORTAGGI", sortOrder: 3 },
  { name: "Erbe Aromatiche", slug: "erbe-aromatiche", type: "ERBE_AROMATICHE", sortOrder: 4 },
  { name: "Frutta Esotica", slug: "frutta-esotica", type: "FRUTTA_ESOTICA", sortOrder: 5 },
  { name: "Frutta Secca", slug: "frutta-secca", type: "FRUTTA_SECCA", sortOrder: 6 },
  { name: "Spezie", slug: "spezie", type: "SPEZIE", sortOrder: 7 },
];

export const BASE_PRODUCTS = [
    // === FRUTTA ===
    { name: "Mele Golden", slug: "mele-golden", unit: "KG", price: 2.50, cost: 1.80, sku: "FRU-001", catSlug: "frutta" },
    { name: "Mele Fuji", slug: "mele-fuji", unit: "KG", price: 2.80, cost: 1.90, sku: "FRU-002", catSlug: "frutta" },
    { name: "Mele Annurca", slug: "mele-annurca", unit: "KG", price: 3.50, cost: 2.40, sku: "FRU-003", catSlug: "frutta" },
    { name: "Arance Tarocco", slug: "arance-tarocco", unit: "KG", price: 2.80, cost: 1.90, sku: "FRU-004", catSlug: "frutta" },
    { name: "Arance Navel", slug: "arance-navel", unit: "KG", price: 2.50, cost: 1.70, sku: "FRU-005", catSlug: "frutta" },
    { name: "Limoni di Amalfi", slug: "limoni-amalfi", unit: "KG", price: 3.50, cost: 2.50, sku: "FRU-006", catSlug: "frutta" },
    { name: "Pere Abate", slug: "pere-abate", unit: "KG", price: 3.20, cost: 2.20, sku: "FRU-008", catSlug: "frutta" },
    { name: "Fragole", slug: "fragole", unit: "KG", price: 6.00, cost: 4.00, sku: "FRU-010", catSlug: "frutta" },
    { name: "Banane", slug: "banane", unit: "KG", price: 1.80, cost: 1.10, sku: "FRU-011", catSlug: "frutta" },
    { name: "Uva Italia", slug: "uva-italia", unit: "KG", price: 3.50, cost: 2.30, sku: "FRU-012", catSlug: "frutta" },
    { name: "Pesche Gialle", slug: "pesche-gialle", unit: "KG", price: 3.50, cost: 2.30, sku: "FRU-014", catSlug: "frutta" },
    { name: "Albicocche", slug: "albicocche", unit: "KG", price: 4.50, cost: 3.00, sku: "FRU-016", catSlug: "frutta" },
    { name: "Ciliegie", slug: "ciliegie", unit: "KG", price: 8.00, cost: 5.50, sku: "FRU-017", catSlug: "frutta" },
    { name: "Kiwi", slug: "kiwi", unit: "KG", price: 3.00, cost: 2.00, sku: "FRU-018", catSlug: "frutta" },
    { name: "Mandarini", slug: "mandarini", unit: "KG", price: 2.80, cost: 1.80, sku: "FRU-019", catSlug: "frutta" },

    // === VERDURA ===
    { name: "Pomodori San Marzano", slug: "pomodori-san-marzano", unit: "KG", price: 3.00, cost: 2.00, sku: "VER-001", catSlug: "verdura" },
    { name: "Pomodori Ciliegino", slug: "pomodori-ciliegino", unit: "KG", price: 4.00, cost: 2.80, sku: "VER-002", catSlug: "verdura" },
    { name: "Insalata Gentile", slug: "insalata-gentile", unit: "PEZZI", price: 1.50, cost: 0.90, sku: "VER-004", catSlug: "verdura" },
    { name: "Lattuga Iceberg", slug: "lattuga-iceberg", unit: "PEZZI", price: 1.60, cost: 0.90, sku: "VER-006", catSlug: "verdura" },
    { name: "Rucola", slug: "rucola", unit: "MAZZO", price: 1.80, cost: 1.00, sku: "VER-007", catSlug: "verdura" },
    { name: "Spinaci", slug: "spinaci", unit: "KG", price: 4.50, cost: 3.00, sku: "VER-008", catSlug: "verdura" },
    { name: "Zucchine", slug: "zucchine", unit: "KG", price: 2.80, cost: 1.80, sku: "VER-009", catSlug: "verdura" },
    { name: "Cavolo Nero", slug: "cavolo-nero", unit: "KG", price: 3.00, cost: 1.80, sku: "VER-011", catSlug: "verdura" },
    { name: "Broccoli", slug: "broccoli", unit: "KG", price: 2.80, cost: 1.70, sku: "VER-012", catSlug: "verdura" },
    { name: "Radicchio Trevigiano", slug: "radicchio-trevigiano", unit: "KG", price: 5.00, cost: 3.20, sku: "VER-014", catSlug: "verdura" },

    // === ORTAGGI ===
    { name: "Peperoni Rossi", slug: "peperoni-rossi", unit: "KG", price: 3.50, cost: 2.30, sku: "ORT-001", catSlug: "ortaggi" },
    { name: "Peperoni Gialli", slug: "peperoni-gialli", unit: "KG", price: 3.50, cost: 2.30, sku: "ORT-002", catSlug: "ortaggi" },
    { name: "Melanzane", slug: "melanzane", unit: "KG", price: 2.50, cost: 1.70, sku: "ORT-004", catSlug: "ortaggi" },
    { name: "Carote", slug: "carote", unit: "KG", price: 1.80, cost: 1.00, sku: "ORT-005", catSlug: "ortaggi" },
    { name: "Patate", slug: "patate", unit: "KG", price: 1.20, cost: 0.70, sku: "ORT-006", catSlug: "ortaggi" },
    { name: "Cipolle Dorate", slug: "cipolle-dorate", unit: "KG", price: 1.50, cost: 0.80, sku: "ORT-008", catSlug: "ortaggi" },
    { name: "Cipolle Rosse Tropea", slug: "cipolle-rosse-tropea", unit: "KG", price: 2.50, cost: 1.50, sku: "ORT-009", catSlug: "ortaggi" },
    { name: "Aglio Bianco", slug: "aglio-bianco", unit: "KG", price: 8.00, cost: 5.00, sku: "ORT-010", catSlug: "ortaggi" },
    { name: "Finocchi", slug: "finocchi", unit: "PEZZI", price: 2.00, cost: 1.20, sku: "ORT-012", catSlug: "ortaggi" },
    { name: "Zucca", slug: "zucca", unit: "KG", price: 2.00, cost: 1.20, sku: "ORT-015", catSlug: "ortaggi" },

    // === ERBE AROMATICHE ===
    { name: "Basilico Fresco", slug: "basilico-fresco", unit: "MAZZO", price: 1.50, cost: 0.80, sku: "ERB-001", catSlug: "erbe-aromatiche" },
    { name: "Prezzemolo", slug: "prezzemolo", unit: "MAZZO", price: 1.00, cost: 0.50, sku: "ERB-002", catSlug: "erbe-aromatiche" },
    { name: "Rosmarino", slug: "rosmarino", unit: "MAZZO", price: 1.20, cost: 0.60, sku: "ERB-003", catSlug: "erbe-aromatiche" },

    // === FRUTTA ESOTICA ===
    { name: "Avocado", slug: "avocado", unit: "PEZZI", price: 2.50, cost: 1.60, sku: "ESO-001", catSlug: "frutta-esotica" },
    { name: "Mango", slug: "mango", unit: "PEZZI", price: 3.50, cost: 2.20, sku: "ESO-002", catSlug: "frutta-esotica" },
    { name: "Ananas", slug: "ananas", unit: "PEZZI", price: 3.00, cost: 1.80, sku: "ESO-004", catSlug: "frutta-esotica" },

    // === FRUTTA SECCA ===
    { name: "Noci", slug: "noci", unit: "KG", price: 12.00, cost: 8.00, sku: "SEC-001", catSlug: "frutta-secca" },
    { name: "Mandorle", slug: "mandorle", unit: "KG", price: 14.00, cost: 9.50, sku: "SEC-002", catSlug: "frutta-secca" },
    { name: "Pistacchi", slug: "pistacchi", unit: "KG", price: 22.00, cost: 15.00, sku: "SEC-004", catSlug: "frutta-secca" },
];

export async function seedTenantCatalog(tenantDb: any, org: any) {
  console.log("🏢 Nota: il profilo aziendale verrà compilato dal cliente in Impostazioni > Azienda");

  console.log("🌱 Insert delle categorie base...");
  for (const cat of BASE_CATEGORIES) {
    await tenantDb.productCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Recupera categorie create per collegarle ai prodotti
  const categories = await tenantDb.productCategory.findMany();
  const catMap = new Map(categories.map((c: any) => [c.slug, c.id]));

  console.log("🍏 Insert dei 50+ prodotti dello Starter Kit...");
  for (const prod of BASE_PRODUCTS) {
    const categoryId = catMap.get(prod.catSlug);
    if (categoryId) {
      await tenantDb.product.upsert({
        where: { slug: prod.slug },
        update: {},
        create: {
          name: prod.name,
          slug: prod.slug,
          unit: prod.unit,
          price: prod.price,
          cost: prod.cost,
          sku: prod.sku,
          categoryId: categoryId,
        },
      });
    }
  }
}
