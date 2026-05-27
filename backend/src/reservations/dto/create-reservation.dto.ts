import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateReservationDto {
  @IsInt()
  @Min(1)
  tableId: number;

  @IsString()
  @MaxLength(80)
  customerName: string;

  @IsString()
  @MaxLength(30)
  customerPhone: string;

  @IsInt()
  @Min(1)
  guestCount: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
