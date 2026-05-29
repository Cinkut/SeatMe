import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelByPhoneDto {
  @IsString()
  @MinLength(9)
  @MaxLength(30)
  customerPhone: string;
}
