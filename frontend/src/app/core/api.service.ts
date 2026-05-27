import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Reservation, RestaurantTable } from '../models';

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

  getTables() {
    return this.http.get<RestaurantTable[]>(`${this.apiUrl}/tables`);
  }

  getReservations() {
    return this.http.get<Reservation[]>(`${this.apiUrl}/reservations`);
  }

  createReservation(form: ReservationForm) {
    return this.http.post<Reservation>(`${this.apiUrl}/reservations`, form);
  }

  cancelReservation(id: number) {
    return this.http.delete<Reservation>(`${this.apiUrl}/reservations/${id}`);
  }
}
