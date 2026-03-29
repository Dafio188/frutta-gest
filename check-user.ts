
import { PrismaClient } from './src/generated/master-client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'fio.davide@gmail.com' }
    });

    if (user) {
      console.log('✅ Utente trovato nel Master DB:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password settata: ${!!user.password}`);
      console.log(`   Hash (inizi con): ${user.password?.substring(0, 10)}...`);
      console.log(`   Attivo: ${user.isActive}`);
    } else {
      console.log('❌ Utente NON trovato nel Master DB.');
    }
  } catch (e) {
    console.error('❌ Errore:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
