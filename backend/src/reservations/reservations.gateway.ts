import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  RESERVATION_CANCELLED_EVENT,
  RESERVATION_CREATED_EVENT,
  ReservationEventPayload,
} from './events/reservation.events';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200',
  },
})
export class ReservationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ReservationsGateway.name);

  @WebSocketServer()
  private server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to reservations socket: ${client.id}`);
  }

  @OnEvent(RESERVATION_CREATED_EVENT)
  handleReservationCreated(payload: ReservationEventPayload) {
    this.server.emit('reservations.changed', {
      type: RESERVATION_CREATED_EVENT,
      reservation: payload,
    });
  }

  @OnEvent(RESERVATION_CANCELLED_EVENT)
  handleReservationCancelled(payload: ReservationEventPayload) {
    this.server.emit('reservations.changed', {
      type: RESERVATION_CANCELLED_EVENT,
      reservation: payload,
    });
  }
}
