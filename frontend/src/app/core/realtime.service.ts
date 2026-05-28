import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface ReservationChangedEvent {
  type: 'reservation.created' | 'reservation.cancelled';
  reservation: {
    reservationId: number;
    tableId: number;
    customerName: string;
    startTime: string;
    endTime: string;
  };
}

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket?: Socket;

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  reservationChanges(): Observable<ReservationChangedEvent> {
    return new Observable((subscriber) => {
      this.connect();
      const handler = (event: ReservationChangedEvent) => subscriber.next(event);

      this.socket?.on('reservations.changed', handler);

      return () => {
        this.socket?.off('reservations.changed', handler);
      };
    });
  }
}
