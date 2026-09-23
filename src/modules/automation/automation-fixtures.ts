import type { Prisma } from 'src/generated/prisma/client';
import {
  BookingStatus,
  DayOfWeek,
  MfaMethod,
  Role,
} from 'src/generated/prisma/enums';

export const AUTOMATION_FIXTURE_VERSION = 'customer-e2e-v1';
export const AUTOMATION_CUSTOMER_PASSWORD = 'AutomationPassword1!';

export const automationFixtureAccounts = {
  customer: 'e2e.customer@example.test',
  mfaCustomer: 'e2e.mfa@example.test',
  unverifiedCustomer: 'e2e.unverified@example.test',
} as const;

const fixtureIds = {
  barberEric: 'automation-barber-eric',
  barberSam: 'automation-barber-sam',
  serviceBeard: 'automation-service-beard',
  serviceHaircut: 'automation-service-haircut',
  serviceHaircutBeard: 'automation-service-haircut-beard',
  userBarberEric: 'automation-user-barber-eric',
  userBarberSam: 'automation-user-barber-sam',
  userCustomer: 'automation-user-customer',
  userMfaCustomer: 'automation-user-mfa-customer',
  userUnverifiedCustomer: 'automation-user-unverified-customer',
} as const;

const workingDays = Object.values(DayOfWeek);

function relativeDate(now: Date, dayOffset: number, hour: number): Date {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

export async function resetAndSeedAutomationData(
  tx: Prisma.TransactionClient,
  passwordHash: string,
  now = new Date(),
) {
  await tx.bookingCreationIdempotency.deleteMany();
  await tx.booking.deleteMany();
  await tx.outboxEvent.deleteMany();
  await tx.session.deleteMany();
  await tx.mfaChallenge.deleteMany();
  await tx.mfa.deleteMany();
  await tx.externalAccount.deleteMany();
  await tx.barberAvailabilityException.deleteMany();
  await tx.barberAvailabilityRule.deleteMany();
  await tx.barber.deleteMany();
  await tx.service.deleteMany();
  await tx.user.deleteMany();

  await tx.service.createMany({
    data: [
      {
        id: fixtureIds.serviceHaircut,
        name: 'Automation Haircut',
        description: 'Deterministic haircut fixture for browser automation.',
        durationMinutes: 30,
        pricePence: 2500,
        isActive: true,
      },
      {
        id: fixtureIds.serviceBeard,
        name: 'Automation Beard Trim',
        description: 'Deterministic beard fixture for browser automation.',
        durationMinutes: 30,
        pricePence: 1500,
        isActive: true,
      },
      {
        id: fixtureIds.serviceHaircutBeard,
        name: 'Automation Haircut and Beard',
        description: 'Deterministic combined fixture for browser automation.',
        durationMinutes: 60,
        pricePence: 3500,
        isActive: true,
      },
    ],
  });

  await tx.user.createMany({
    data: [
      {
        id: fixtureIds.userCustomer,
        name: 'Automation Customer',
        email: automationFixtureAccounts.customer,
        passwordHash,
        role: Role.CUSTOMER,
        isEmailVerified: true,
      },
      {
        id: fixtureIds.userMfaCustomer,
        name: 'Automation MFA Customer',
        email: automationFixtureAccounts.mfaCustomer,
        passwordHash,
        role: Role.CUSTOMER,
        isEmailVerified: true,
        mfaEnabled: true,
        mfaMethod: MfaMethod.EMAIL,
      },
      {
        id: fixtureIds.userUnverifiedCustomer,
        name: 'Automation Unverified Customer',
        email: automationFixtureAccounts.unverifiedCustomer,
        passwordHash,
        role: Role.CUSTOMER,
        isEmailVerified: false,
      },
      {
        id: fixtureIds.userBarberEric,
        name: 'Automation Eric',
        email: 'e2e.barber.eric@example.test',
        passwordHash,
        role: Role.BARBER,
        isEmailVerified: true,
      },
      {
        id: fixtureIds.userBarberSam,
        name: 'Automation Sam',
        email: 'e2e.barber.sam@example.test',
        passwordHash,
        role: Role.BARBER,
        isEmailVerified: true,
      },
    ],
  });

  await tx.barber.createMany({
    data: [
      {
        id: fixtureIds.barberEric,
        userId: fixtureIds.userBarberEric,
        displayName: 'Automation Eric',
        phone: '+447900100001',
        isActive: true,
      },
      {
        id: fixtureIds.barberSam,
        userId: fixtureIds.userBarberSam,
        displayName: 'Automation Sam',
        phone: '+447900100002',
        isActive: true,
      },
    ],
  });

  await tx.barberAvailabilityRule.createMany({
    data: [fixtureIds.barberEric, fixtureIds.barberSam].flatMap((barberId) =>
      workingDays.map((dayOfWeek) => ({
        barberId,
        dayOfWeek,
        startMinute: 9 * 60,
        endMinute: 17 * 60,
        isActive: true,
      })),
    ),
  });

  const upcomingStart = relativeDate(now, 7, 10);
  const pastStart = relativeDate(now, -7, 10);
  const cancelledStart = relativeDate(now, 8, 11);
  const sameDayStart = relativeDate(now, 0, 15);
  const guestStart = relativeDate(now, 9, 12);
  const thirtyMinutes = 30 * 60 * 1000;

  await tx.booking.createMany({
    data: [
      {
        id: '10000000-0000-4000-8000-000000000001',
        userId: fixtureIds.userCustomer,
        barberId: fixtureIds.barberEric,
        serviceId: fixtureIds.serviceHaircut,
        serviceNameSnapshot: 'Automation Haircut',
        serviceDurationMinutesSnapshot: 30,
        servicePricePenceSnapshot: 2500,
        status: BookingStatus.CONFIRMED,
        startTime: upcomingStart,
        endTime: new Date(upcomingStart.getTime() + thirtyMinutes),
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        userId: fixtureIds.userCustomer,
        barberId: fixtureIds.barberEric,
        serviceId: fixtureIds.serviceHaircut,
        serviceNameSnapshot: 'Automation Haircut',
        serviceDurationMinutesSnapshot: 30,
        servicePricePenceSnapshot: 2500,
        status: BookingStatus.CONFIRMED,
        startTime: pastStart,
        endTime: new Date(pastStart.getTime() + thirtyMinutes),
      },
      {
        id: '10000000-0000-4000-8000-000000000003',
        userId: fixtureIds.userCustomer,
        barberId: fixtureIds.barberSam,
        serviceId: fixtureIds.serviceBeard,
        serviceNameSnapshot: 'Automation Beard Trim',
        serviceDurationMinutesSnapshot: 30,
        servicePricePenceSnapshot: 1500,
        status: BookingStatus.CANCELLED,
        startTime: cancelledStart,
        endTime: new Date(cancelledStart.getTime() + thirtyMinutes),
        cancelledAt: new Date(now),
        cancelledByUserId: fixtureIds.userCustomer,
      },
      {
        id: '10000000-0000-4000-8000-000000000004',
        userId: fixtureIds.userCustomer,
        barberId: fixtureIds.barberSam,
        serviceId: fixtureIds.serviceHaircut,
        serviceNameSnapshot: 'Automation Haircut',
        serviceDurationMinutesSnapshot: 30,
        servicePricePenceSnapshot: 2500,
        status: BookingStatus.CONFIRMED,
        startTime: sameDayStart,
        endTime: new Date(sameDayStart.getTime() + thirtyMinutes),
      },
      {
        id: '10000000-0000-4000-8000-000000000005',
        customerName: 'Automation Guest',
        customerEmail: 'e2e.guest@example.test',
        customerPhone: '+447900100003',
        barberId: fixtureIds.barberEric,
        serviceId: fixtureIds.serviceBeard,
        serviceNameSnapshot: 'Automation Beard Trim',
        serviceDurationMinutesSnapshot: 30,
        servicePricePenceSnapshot: 1500,
        status: BookingStatus.CONFIRMED,
        startTime: guestStart,
        endTime: new Date(guestStart.getTime() + thirtyMinutes),
      },
    ],
  });

  return {
    accounts: automationFixtureAccounts,
    bookingReferences: {
      cancelled: '10000000-0000-4000-8000-000000000003',
      guest: '10000000-0000-4000-8000-000000000005',
      past: '10000000-0000-4000-8000-000000000002',
      sameDay: '10000000-0000-4000-8000-000000000004',
      upcoming: '10000000-0000-4000-8000-000000000001',
    },
  };
}
