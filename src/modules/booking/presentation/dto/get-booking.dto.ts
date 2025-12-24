export class GetBookingDto {
  readonly id: string;
  readonly userId: string;
}

export class GetAllBookingsDto {
  readonly userId: string;
}

export class GetBookingsQueryDto {
  readonly userId: string;
  readonly page?: number;
  readonly limit?: number;
}
