import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CancelByPhoneDto } from '../reservations/dto/cancel-by-phone.dto';
import { CreateReservationDto } from '../reservations/dto/create-reservation.dto';
import { ReservationsService } from '../reservations/reservations.service';

@Controller('public/reservations')
export class PublicReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('occupancy')
  findOccupancy() {
    return this.reservationsService.findOccupancy();
  }

  @Get('mine')
  findMine(@Query('phone') phone: string) {
    return this.reservationsService.findByPhone(phone);
  }

  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  @Delete(':id')
  cancel(@Param('id', ParseIntPipe) id: number, @Body() dto: CancelByPhoneDto) {
    return this.reservationsService.cancelByCustomer(id, dto.customerPhone);
  }
}
