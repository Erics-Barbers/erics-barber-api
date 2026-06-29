import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { DayOfWeek, Role } from '../src/generated/prisma/enums';
import {
  demoBarbers,
  demoServices,
  legacyDemoServiceNames,
} from './booking-dev-data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const workingDays = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

async function seedServices() {
  await prisma.service.updateMany({
    where: { name: { in: legacyDemoServiceNames } },
    data: { isActive: false },
  });

  for (const service of demoServices) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {
        description: service.description,
        durationMinutes: 30,
        isActive: true,
        pricePence: service.pricePence,
      },
      create: {
        ...service,
        durationMinutes: 30,
        isActive: true,
      },
    });
  }
}

async function seedBarbers() {
  const barberIds: string[] = [];

  for (const barber of demoBarbers) {
    const user = await prisma.user.upsert({
      where: { email: barber.email },
      update: {
        isEmailVerified: true,
        name: barber.displayName,
        role: Role.BARBER,
      },
      create: {
        email: barber.email,
        isEmailVerified: true,
        name: barber.displayName,
        role: Role.BARBER,
      },
    });

    const barberProfile = await prisma.barber.upsert({
      where: { userId: user.id },
      update: {
        deactivatedAt: null,
        displayName: barber.displayName,
        isActive: true,
        phone: barber.phone,
      },
      create: {
        displayName: barber.displayName,
        isActive: true,
        phone: barber.phone,
        userId: user.id,
      },
    });

    barberIds.push(barberProfile.id);
  }

  await prisma.barberAvailabilityRule.deleteMany({
    where: { barberId: { in: barberIds } },
  });

  await prisma.barberAvailabilityRule.createMany({
    data: barberIds.flatMap((barberId) =>
      workingDays.map((dayOfWeek) => ({
        barberId,
        dayOfWeek,
        endMinute: 17 * 60,
        startMinute: 9 * 60,
      })),
    ),
  });
}

async function main() {
  await seedServices();
  await seedBarbers();
  console.log('Seeded booking demo services, barbers, and availability.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
