-- Prevent two active bookings from occupying the same barber slot.
-- Cancelled bookings remain historical records and do not block rebooking.
CREATE UNIQUE INDEX "Booking_active_barber_startTime_key"
ON "Booking"("barberId", "startTime")
WHERE "barberId" IS NOT NULL AND "status" <> 'CANCELLED';
