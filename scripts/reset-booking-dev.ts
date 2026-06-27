import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { demoBarbers, demoServices } from './booking-dev-data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const demoEmails = demoBarbers.map((barber) => barber.email);
  const demoServiceNames = demoServices.map((service) => service.name);
  const users = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);
  const barbers = await prisma.barber.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const barberIds = barbers.map((barber) => barber.id);

  await prisma.booking.deleteMany({
    where: {
      OR: [{ userId: { in: userIds } }, { barberId: { in: barberIds } }],
    },
  });
  await prisma.barberAvailabilityException.deleteMany({
    where: { barberId: { in: barberIds } },
  });
  await prisma.barberAvailabilityRule.deleteMany({
    where: { barberId: { in: barberIds } },
  });
  await prisma.barber.deleteMany({
    where: { id: { in: barberIds } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
  await prisma.service.deleteMany({
    where: { name: { in: demoServiceNames } },
  });

  console.log('Reset booking demo data.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
