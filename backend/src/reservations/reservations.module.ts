import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TablesModule } from '../tables/tables.module';
import { ReservationEventsHandler } from './events/reservation-events.handler';
import { ReservationsController } from './reservations.controller';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [PrismaModule, TablesModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository, ReservationEventsHandler],
})
export class ReservationsModule {}
