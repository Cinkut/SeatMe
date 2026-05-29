import { Module } from '@nestjs/common';
import { ReservationsModule } from '../reservations/reservations.module';
import { TablesModule } from '../tables/tables.module';
import { PublicReservationsController } from './public-reservations.controller';
import { PublicTablesController } from './public-tables.controller';

@Module({
  imports: [TablesModule, ReservationsModule],
  controllers: [PublicTablesController, PublicReservationsController],
})
export class PublicModule {}
