import { PrismaClient, TableLocation } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@seatme.local' },
    update: {},
    create: {
      email: 'admin@seatme.local',
      name: 'Admin',
      passwordHash,
    },
  });

  const tables = [
    { number: 1, capacity: 2, location: TableLocation.WINDOW },
    { number: 2, capacity: 4, location: TableLocation.CENTER },
    { number: 3, capacity: 2, location: TableLocation.WINDOW },
    { number: 4, capacity: 4, location: TableLocation.CENTER },
    { number: 5, capacity: 6, location: TableLocation.CENTER },
    { number: 6, capacity: 4, location: TableLocation.TERRACE },
    { number: 7, capacity: 8, location: TableLocation.CENTER },
    { number: 8, capacity: 2, location: TableLocation.WINDOW },
    { number: 9, capacity: 4, location: TableLocation.CENTER },
    { number: 10, capacity: 6, location: TableLocation.TERRACE },
    { number: 11, capacity: 4, location: TableLocation.TERRACE },
    { number: 12, capacity: 8, location: TableLocation.TERRACE },
  ];

  for (const table of tables) {
    await prisma.restaurantTable.upsert({
      where: { number: table.number },
      update: table,
      create: table,
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
