export const RESERVATION_CREATED_EVENT = 'reservation.created';
export const RESERVATION_CANCELLED_EVENT = 'reservation.cancelled';

export interface ReservationEventPayload {
  reservationId: number;
  tableId: number;
  customerName: string;
  startTime: string;
  endTime: string;
}
