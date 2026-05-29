import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OccupancySlot, Reservation, RestaurantTable } from '../models';

export interface ReservationForm {
  tableId: number;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  startTime: string;
  endTime: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  getPublicTables() {
    return this.http.get<RestaurantTable[]>(`${this.apiUrl}/public/tables`);
  }

  getOccupancy() {
    return this.http.get<OccupancySlot[]>(`${this.apiUrl}/public/reservations/occupancy`);
  }

  createPublicReservation(form: ReservationForm) {
    return this.http.post<Reservation>(`${this.apiUrl}/public/reservations`, form);
  }

  getMyReservations(phone: string) {
    return this.http.get<Reservation[]>(`${this.apiUrl}/public/reservations/mine`, {
      params: { phone },
    });
  }

  cancelMyReservation(id: number, customerPhone: string) {
    return this.http.delete<Reservation>(`${this.apiUrl}/public/reservations/${id}`, {
      body: { customerPhone },
    });
  }

  getAdminReservations() {
    return this.http.get<Reservation[]>(`${this.apiUrl}/reservations`);
  }

  cancelAdminReservation(id: number) {
    return this.http.delete<Reservation>(`${this.apiUrl}/reservations/${id}`);
  }
}
