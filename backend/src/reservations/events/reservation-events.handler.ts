import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RESERVATION_CANCELLED_EVENT,
  RESERVATION_CREATED_EVENT,
  ReservationEventPayload,
} from './reservation.events';

@Injectable()
export class ReservationEventsHandler {
  private readonly logger = new Logger(ReservationEventsHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(RESERVATION_CREATED_EVENT)
  async handleCreated(payload: ReservationEventPayload) {
    this.logger.log(`Reservation created: ${JSON.stringify(payload)}`);
    await this.saveAuditLog(RESERVATION_CREATED_EVENT, payload);
  }

  @OnEvent(RESERVATION_CANCELLED_EVENT)
  async handleCancelled(payload: ReservationEventPayload) {
    this.logger.log(`Reservation cancelled: ${JSON.stringify(payload)}`);
    await this.saveAuditLog(RESERVATION_CANCELLED_EVENT, payload);
  }

  private saveAuditLog(eventName: string, payload: ReservationEventPayload) {
    return this.prisma.auditLog.create({
      data: {
        eventName,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
