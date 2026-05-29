import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService, ReservationForm } from '../core/api.service';
import { RealtimeService } from '../core/realtime.service';
import { OccupancySlot, Reservation, RestaurantTable } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Rezerwacja online</p>
          <h1>Zarezerwuj stolik</h1>
          <p>Wybierz termin, kliknij wolny stolik na mapie i wyslij formularz.</p>
        </div>
      </header>

      <section class="grid">
        <div class="card">
          <h2>Nowa rezerwacja</h2>
          <label>
            Imie i nazwisko
            <input [(ngModel)]="form.customerName" type="text">
          </label>
          <label>
            Telefon
            <input [(ngModel)]="form.customerPhone" type="tel" placeholder="np. 600123456">
          </label>
          <label>
            Liczba osob
            <input [(ngModel)]="form.guestCount" type="number" min="1">
          </label>
          <label>
            Start
            <input [(ngModel)]="form.startTime" type="datetime-local">
          </label>
          <label>
            Koniec
            <input [(ngModel)]="form.endTime" type="datetime-local">
          </label>
          <label>
            Notatka
            <textarea [(ngModel)]="form.note"></textarea>
          </label>
          <p class="hint" *ngIf="form.tableId">Wybrany stolik nr {{ selectedTableNumber() }}</p>
          <button type="button" (click)="createReservation()">Wyslij rezerwacje</button>
        </div>

        <div class="card">
          <div class="section-heading">
            <h2>Mapa stolikow</h2>
            <span class="hint">Kliknij wolny stolik</span>
          </div>
          <div class="legend">
            <span><i class="dot available-dot"></i> wolny</span>
            <span><i class="dot reserved-dot"></i> zajety</span>
            <span><i class="dot selected-dot"></i> wybrany</span>
          </div>
          <div class="floor-plan" aria-label="Plan sali restauracyjnej">
            <div class="room-title">Sala restauracyjna</div>
            <div class="decor bar">Bar</div>
            <div class="decor aisle">Przejscie</div>
            <div class="decor entrance">Wejscie</div>
            <button
              *ngFor="let table of tables()"
              type="button"
              class="restaurant-table"
              [ngClass]="['table-pos-' + table.number, tableShape(table)]"
              [class.available]="tableAvailability(table) === 'available'"
              [class.reserved]="tableAvailability(table) === 'reserved'"
              [class.selected]="form.tableId === table.id"
              [disabled]="tableAvailability(table) === 'reserved'"
              (click)="selectTable(table)"
            >
              <span class="chair chair-top"></span>
              <span class="chair chair-right"></span>
              <span class="chair chair-bottom"></span>
              <span class="chair chair-left"></span>
              <span class="table-surface">
                <span>{{ table.capacity }} os.</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Moje rezerwacje</h2>
        <p class="hint">Podaj ten sam numer telefonu co przy rezerwacji, zeby zobaczyc lub anulowac wizyte.</p>
        <label>
          Numer telefonu
          <input [(ngModel)]="lookupPhone" type="tel">
        </label>
        <button type="button" class="secondary" (click)="loadMyReservations()">Pokaz moje rezerwacje</button>

        <div class="reservation-list" *ngIf="myReservations().length">
          <article *ngFor="let reservation of myReservations()" class="reservation">
            <div>
              <strong>Stolik {{ reservation.tableNumber }}</strong>
              <p>
                {{ reservation.guestCount }} os.,
                {{ reservation.startTime | date:'short' }} - {{ reservation.endTime | date:'shortTime' }}
              </p>
              <span
                class="badge"
                [class.cancelled]="reservation.status === 'CANCELLED'"
                [class.completed]="reservation.status === 'COMPLETED'"
              >
                {{ reservation.status }}
              </span>
            </div>
            <button
              type="button"
              class="secondary"
              [disabled]="reservation.status !== 'ACTIVE'"
              (click)="cancelMyReservation(reservation.id)"
            >
              Anuluj
            </button>
          </article>
        </div>
      </section>

      <p *ngIf="message()" class="message">{{ message() }}</p>
    </main>
  `,
})
export class PublicPageComponent implements OnInit, OnDestroy {
  form: ReservationForm = this.emptyForm();
  lookupPhone = '';
  private realtimeSubscription?: Subscription;

  readonly tables = signal<RestaurantTable[]>([]);
  readonly occupancy = signal<OccupancySlot[]>([]);
  readonly myReservations = signal<Reservation[]>([]);
  readonly message = signal('');

  constructor(
    private readonly api: ApiService,
    private readonly realtime: RealtimeService,
  ) {}

  ngOnInit() {
    this.loadData();
    this.connectRealtime();
  }

  ngOnDestroy() {
    this.realtimeSubscription?.unsubscribe();
    this.realtime.disconnect();
  }

  loadData() {
    this.api.getPublicTables().subscribe({
      next: (tables) => this.tables.set(tables),
      error: (error) => this.showError(error),
    });

    this.api.getOccupancy().subscribe({
      next: (occupancy) => this.occupancy.set(occupancy),
      error: (error) => this.showError(error),
    });
  }

  loadMyReservations() {
    if (!this.lookupPhone.trim()) {
      this.message.set('Podaj numer telefonu.');
      return;
    }

    this.api.getMyReservations(this.lookupPhone.trim()).subscribe({
      next: (reservations) => {
        this.myReservations.set(reservations);
        this.message.set(
          reservations.length ? 'Pobrano Twoje rezerwacje.' : 'Brak rezerwacji dla tego numeru.',
        );
      },
      error: (error) => this.showError(error),
    });
  }

  createReservation() {
    if (!this.form.tableId || !this.form.startTime || !this.form.endTime) {
      this.message.set('Wybierz stolik oraz termin rezerwacji.');
      return;
    }

    if (!this.form.customerPhone.trim()) {
      this.message.set('Podaj numer telefonu.');
      return;
    }

    const payload = {
      ...this.form,
      startTime: new Date(this.form.startTime).toISOString(),
      endTime: new Date(this.form.endTime).toISOString(),
    };

    this.api.createPublicReservation(payload).subscribe({
      next: () => {
        this.message.set('Rezerwacja wyslana. Zapisz numer telefonu do anulowania.');
        this.lookupPhone = this.form.customerPhone;
        this.form = this.emptyForm();
        this.loadData();
        this.loadMyReservations();
      },
      error: (error) => this.showError(error),
    });
  }

  cancelMyReservation(id: number) {
    const phone = this.lookupPhone.trim() || this.form.customerPhone.trim();
    if (!phone) {
      this.message.set('Podaj numer telefonu w sekcji Moje rezerwacje.');
      return;
    }

    this.api.cancelMyReservation(id, phone).subscribe({
      next: () => {
        this.message.set('Rezerwacja anulowana.');
        this.loadData();
        this.loadMyReservations();
      },
      error: (error) => this.showError(error),
    });
  }

  selectTable(table: RestaurantTable) {
    if (this.tableAvailability(table) === 'reserved') {
      this.message.set('Ten stolik jest zajety w wybranym terminie.');
      return;
    }

    this.form.tableId = table.id;
    this.message.set(`Wybrano stolik ${table.number}.`);
  }

  selectedTableNumber(): number | null {
    return this.tables().find((table) => table.id === this.form.tableId)?.number ?? null;
  }

  tableAvailability(table: RestaurantTable): 'available' | 'reserved' {
    const selectedRange = this.selectedRange();
    if (!selectedRange) {
      return 'available';
    }

    const isReserved = this.occupancy().some((slot) => {
      if (slot.tableId !== table.id || slot.status !== 'ACTIVE') {
        return false;
      }

      return this.rangesOverlap(
        selectedRange.start,
        selectedRange.end,
        new Date(slot.startTime),
        new Date(slot.endTime),
      );
    });

    return isReserved ? 'reserved' : 'available';
  }

  tableShape(table: RestaurantTable): string {
    if (table.capacity <= 2) {
      return 'table-small';
    }

    if (table.capacity >= 6) {
      return 'table-wide';
    }

    return 'table-medium';
  }

  private emptyForm(): ReservationForm {
    return {
      tableId: 0,
      customerName: '',
      customerPhone: '',
      guestCount: 2,
      startTime: '',
      endTime: '',
      note: '',
    };
  }

  private showError(error: { error?: { message?: string | string[] } }) {
    const message = error.error?.message;
    this.message.set(Array.isArray(message) ? message.join(', ') : message ?? 'Wystapil blad.');
  }

  private connectRealtime() {
    this.realtimeSubscription = this.realtime.reservationChanges().subscribe(() => {
      this.loadData();
      if (this.lookupPhone.trim()) {
        this.loadMyReservations();
      }
    });
  }

  private selectedRange(): { start: Date; end: Date } | null {
    if (!this.form.startTime || !this.form.endTime) {
      return null;
    }

    const start = new Date(this.form.startTime);
    const end = new Date(this.form.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return null;
    }

    return { start, end };
  }

  private rangesOverlap(firstStart: Date, firstEnd: Date, secondStart: Date, secondEnd: Date) {
    return firstStart < secondEnd && firstEnd > secondStart;
  }
}
