import { renderBrandedEmail } from './email-layout';

type BookingEmailInput = {
  appointmentDate: Date;
  barberName?: string | null;
  bookingReference: string;
  serviceName?: string | null;
};

export function renderBookingConfirmationEmail({
  appointmentDate,
  barberName,
  bookingReference,
  serviceName,
}: BookingEmailInput): string {
  return renderBrandedEmail({
    details: bookingDetails({
      appointmentDate,
      barberName,
      bookingReference,
      serviceName,
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
  serviceName,
}: BookingEmailInput): string {
  return renderBrandedEmail({
    details: bookingDetails({
      appointmentDate,
      barberName,
      bookingReference,
      serviceName,
    }),
    intro: 'Your booking details have been updated.',
    preheader: "Your Eric's Barbers booking has been updated.",
    title: 'Booking updated',
  });
}

function bookingDetails({
  appointmentDate,
  barberName,
  bookingReference,
  serviceName,
}: BookingEmailInput) {
  return [
    { label: 'Date and time', value: formatDateTime(appointmentDate) },
    ...(serviceName ? [{ label: 'Service', value: serviceName }] : []),
    ...(barberName ? [{ label: 'Barber', value: barberName }] : []),
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
