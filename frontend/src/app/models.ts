export interface OccupancySlot {
  tableId: number;
  startTime: string;
  endTime: string;
  status: string;
}

export interface RestaurantTable {
  id: number;
  number: number;
  capacity: number;
  location: string;
}

export interface Reservation {
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
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}
