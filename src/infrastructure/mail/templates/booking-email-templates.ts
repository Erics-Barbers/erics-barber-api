import { renderBrandedEmail } from './email-layout';

type BookingEmailInput = {
  appointmentDate: Date;
  barberName?: string | null;
  bookingReference: string;
  pricePence?: number | null;
  serviceName?: string | null;
  status?: string | null;
};

export function renderBookingConfirmationEmail({
  appointmentDate,
  barberName,
  bookingReference,
  pricePence,
  serviceName,
  status,
}: BookingEmailInput): string {
  return renderBrandedEmail({
    details: bookingDetails({
      appointmentDate,
      barberName,
      bookingReference,
      pricePence,
      serviceName,
      status,
    }),
    intro:
      'Your appointment has been confirmed. Keep this email for your booking reference.',
    preheader: "Your Eric's Barbers booking is confirmed.",
    title: 'Booking confirmed',
  });
}

export function renderBookingUpdatedEmail({
  appointmentDate,
  barberName,
  bookingReference,
  pricePence,
  serviceName,
  status,
}: BookingEmailInput): string {
  return renderBrandedEmail({
    details: bookingDetails({
      appointmentDate,
      barberName,
      bookingReference,
      pricePence,
      serviceName,
      status,
    }),
    intro: 'Your booking details have been updated.',
    preheader: "Your Eric's Barbers booking has been updated.",
    title: 'Booking updated',
  });
}

export function renderBookingCancelledEmail({
  appointmentDate,
  barberName,
  bookingReference,
  pricePence,
  serviceName,
  status,
}: BookingEmailInput): string {
  return renderBrandedEmail({
    details: bookingDetails({
      appointmentDate,
      barberName,
      bookingReference,
      pricePence,
      serviceName,
      status,
    }),
    intro: 'Your booking has been cancelled.',
    preheader: "Your Eric's Barbers booking has been cancelled.",
    title: 'Booking cancelled',
  });
}

function bookingDetails({
  appointmentDate,
  barberName,
  bookingReference,
  pricePence,
  serviceName,
  status,
}: BookingEmailInput) {
  return [
    { label: 'Date and time', value: formatDateTime(appointmentDate) },
    ...(serviceName ? [{ label: 'Service', value: serviceName }] : []),
    ...(pricePence != null
      ? [{ label: 'Price', value: formatPrice(pricePence) }]
      : []),
    ...(barberName ? [{ label: 'Barber', value: barberName }] : []),
    ...(status ? [{ label: 'Status', value: formatStatus(status) }] : []),
    { label: 'Reference', value: bookingReference },
  ];
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(date);
}

function formatPrice(pricePence: number): string {
  return new Intl.NumberFormat('en-GB', {
    currency: 'GBP',
    style: 'currency',
  }).format(pricePence / 100);
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
