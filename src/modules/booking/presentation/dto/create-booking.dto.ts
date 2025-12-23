export class CreateBookingDto {
  readonly userId: string;
  readonly serviceId: string;
  readonly appointmentDate: Date;
  readonly notes?: string;
}
