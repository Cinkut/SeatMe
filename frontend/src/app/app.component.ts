import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, ReservationForm } from './core/api.service';
import { AuthService } from './core/auth.service';
import { Reservation, RestaurantTable } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">SeatMe</p>
          <h1>Rezerwacje stolikow w restauracji</h1>
          <p>Prosty panel demo: JWT, CRUD, walidacja, eventy i Angular konsumujacy API.</p>
        </div>
        <button *ngIf="isLoggedIn()" type="button" class="secondary" (click)="logout()">Wyloguj</button>
      </header>

      <section *ngIf="!isLoggedIn()" class="card login-card">
        <h2>Logowanie</h2>
        <label>
          Email
          <input [(ngModel)]="email" type="email">
        </label>
        <label>
          Haslo
          <input [(ngModel)]="password" type="password">
        </label>
        <button type="button" (click)="login()">Zaloguj</button>
        <p class="hint">Domyslnie: admin&#64;seatme.local / admin123</p>
      </section>

      <section *ngIf="isLoggedIn()" class="grid">
        <div class="card">
          <h2>Nowa rezerwacja</h2>
          <label>
            Stolik
            <select [(ngModel)]="form.tableId">
              <option [ngValue]="0">Wybierz stolik</option>
              <option *ngFor="let table of tables()" [ngValue]="table.id">
                Stolik {{ table.number }} - {{ table.capacity }} os. - {{ table.location }}
              </option>
            </select>
          </label>
          <label>
            Imie i nazwisko
            <input [(ngModel)]="form.customerName" type="text">
          </label>
          <label>
            Telefon
            <input [(ngModel)]="form.customerPhone" type="text">
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
          <button type="button" (click)="createReservation()">Dodaj rezerwacje</button>
        </div>

        <div class="card">
          <h2>Stoliki</h2>
          <div class="table-list">
            <article *ngFor="let table of tables()" class="table-tile">
              <strong>Stolik {{ table.number }}</strong>
              <span>{{ table.capacity }} os.</span>
              <span>{{ table.location }}</span>
            </article>
          </div>
        </div>
      </section>

      <section *ngIf="isLoggedIn()" class="card">
        <div class="section-heading">
          <h2>Rezerwacje</h2>
          <button type="button" class="secondary" (click)="loadData()">Odswiez</button>
        </div>
        <div class="reservation-list">
          <article *ngFor="let reservation of reservations()" class="reservation">
            <div>
              <strong>{{ reservation.customerName }}</strong>
              <p>
                Stolik {{ reservation.tableNumber }},
                {{ reservation.guestCount }} os.,
                {{ reservation.startTime | date:'short' }} - {{ reservation.endTime | date:'shortTime' }}
              </p>
              <span class="badge" [class.cancelled]="reservation.status === 'CANCELLED'">
                {{ reservation.status }}
              </span>
            </div>
            <button
              type="button"
              class="secondary"
              [disabled]="reservation.status === 'CANCELLED'"
              (click)="cancelReservation(reservation.id)"
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
export class AppComponent implements OnInit {
  email = 'admin@seatme.local';
  password = 'admin123';
  form: ReservationForm = this.emptyForm();

  readonly tables = signal<RestaurantTable[]>([]);
  readonly reservations = signal<Reservation[]>([]);
  readonly message = signal('');
  readonly isLoggedIn = computed(() => Boolean(this.auth.token()));

  constructor(
    private readonly auth: AuthService,
    private readonly api: ApiService,
  ) {}

  ngOnInit() {
    if (this.isLoggedIn()) {
      this.loadData();
    }
  }

  login() {
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.message.set('Zalogowano.');
        this.loadData();
      },
      error: (error) => this.showError(error),
    });
  }

  logout() {
    this.auth.logout();
    this.tables.set([]);
    this.reservations.set([]);
  }

  loadData() {
    this.api.getTables().subscribe({
      next: (tables) => this.tables.set(tables),
      error: (error) => this.showError(error),
    });

    this.api.getReservations().subscribe({
      next: (reservations) => this.reservations.set(reservations),
      error: (error) => this.showError(error),
    });
  }

  createReservation() {
    const payload = {
      ...this.form,
      startTime: new Date(this.form.startTime).toISOString(),
      endTime: new Date(this.form.endTime).toISOString(),
    };

    this.api.createReservation(payload).subscribe({
      next: () => {
        this.message.set('Rezerwacja dodana.');
        this.form = this.emptyForm();
        this.loadData();
      },
      error: (error) => this.showError(error),
    });
  }

  cancelReservation(id: number) {
    this.api.cancelReservation(id).subscribe({
      next: () => {
        this.message.set('Rezerwacja anulowana.');
        this.loadData();
      },
      error: (error) => this.showError(error),
    });
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
}
