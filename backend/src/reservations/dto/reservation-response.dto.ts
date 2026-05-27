import { Reservation, RestaurantTable } from '@prisma/client';

type ReservationWithTable = Reservation & {
  table: RestaurantTable;
};

export class ReservationResponseDto {
  id: number;
  tableId: number;
  tableNumber: number;
  tableCapacity: number;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  startTime: string;
  endTime: string;
  status: string;
  note?: string | null;

  static fromEntity(reservation: ReservationWithTable): ReservationResponseDto {
    return {
      id: reservation.id,
      tableId: reservation.tableId,
      tableNumber: reservation.table.number,
      tableCapacity: reservation.table.capacity,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      guestCount: reservation.guestCount,
      startTime: reservation.startTime.toISOString(),
      endTime: reservation.endTime.toISOString(),
      status: reservation.status,
      note: reservation.note,
    };
  }
}
