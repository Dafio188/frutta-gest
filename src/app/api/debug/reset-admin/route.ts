import { NextResponse } from 'next/server';
import { PrismaClient as MasterClient } from '@/generated/master-client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  if (!process.env.MASTER_DATABASE_URL) {
    return NextResponse.json({ 
      error: 'Variabile MASTER_DATABASE_URL mancante su Vercel!',
      tip: 'Vai su Vercel -> Settings -> Environment Variables e aggiungila.' 
    }, { status: 500 });
  }

  const masterPool = new pg.Pool({ connectionString: process.env.MASTER_DATABASE_URL });
  const masterAdapter = new PrismaPg(masterPool as any);
  const masterDb = new MasterClient({ adapter: masterAdapter });

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Protezione minima per evitare reset accidentali
  if (secret !== 'fruttagest2026') {
    return NextResponse.json({ error: 'Secret non valido' }, { status: 403 });
  }

  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'fio.davide@gmail.com';
    const newPassword = 'Davide2026!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await (masterDb as any).user.upsert({
      where: { email: superAdminEmail },
      update: {
        password: hashedPassword,
        isActive: true,
        role: 'ADMIN',
      },
      create: {
        name: 'Super Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password per ${superAdminEmail} resettata con successo.`,
      new_password: newPassword,
      instructions: 'Accedi ora e poi chiedimi di rimuovere questo file di debug.'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await masterDb.$disconnect();
  }
}
