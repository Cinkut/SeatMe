import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { RealtimeService } from '../core/realtime.service';
import { Reservation } from '../models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Panel admina</p>
          <h1>Rezerwacje restauracji</h1>
          <p>Logowanie JWT. Pelny podglad wszystkich rezerwacji.</p>
        </div>
        <button *ngIf="isLoggedIn()" type="button" class="secondary" (click)="logout()">Wyloguj</button>
      </header>

      <section *ngIf="!isLoggedIn()" class="card login-card">
        <h2>Logowanie admina</h2>
        <label>
          Email
          <input [(ngModel)]="email" type="email">
        </label>
        <label>
          Haslo
          <input [(ngModel)]="password" type="password">
        </label>
        <button type="button" (click)="login()">Zaloguj</button>
      </section>

      <section *ngIf="isLoggedIn()" class="card">
        <div class="section-heading">
          <h2>Wszystkie rezerwacje</h2>
          <button type="button" class="secondary" (click)="loadReservations()">Odswiez</button>
        </div>
        <div class="reservation-list">
          <article *ngFor="let reservation of reservations()" class="reservation">
            <div>
              <strong>{{ reservation.customerName }}</strong>
              <p>
                Tel: {{ reservation.customerPhone }},
                stolik {{ reservation.tableNumber }},
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
export class AdminPageComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  private realtimeSubscription?: Subscription;

  readonly reservations = signal<Reservation[]>([]);
  readonly message = signal('');
  readonly isLoggedIn = computed(() => Boolean(this.auth.token()));

  constructor(
    private readonly auth: AuthService,
    private readonly api: ApiService,
    private readonly realtime: RealtimeService,
  ) {}

  ngOnInit() {
    if (this.isLoggedIn()) {
      this.loadReservations();
      this.connectRealtime();
    }
  }

  ngOnDestroy() {
    this.realtimeSubscription?.unsubscribe();
    this.realtime.disconnect();
  }

  login() {
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.message.set('Zalogowano jako admin.');
        this.loadReservations();
        this.connectRealtime();
      },
      error: (error) => this.showError(error),
    });
  }

  logout() {
    this.auth.logout();
    this.realtimeSubscription?.unsubscribe();
    this.realtime.disconnect();
    this.reservations.set([]);
  }

  loadReservations() {
    this.api.getAdminReservations().subscribe({
      next: (reservations) => this.reservations.set(reservations),
      error: (error) => this.showError(error),
    });
  }

  cancelReservation(id: number) {
    this.api.cancelAdminReservation(id).subscribe({
      next: () => {
        this.message.set('Rezerwacja anulowana.');
        this.loadReservations();
      },
      error: (error) => this.showError(error),
    });
  }

  private connectRealtime() {
    if (this.realtimeSubscription) {
      return;
    }

    this.realtimeSubscription = this.realtime.reservationChanges().subscribe(() => {
      this.loadReservations();
    });
  }

  private showError(error: { error?: { message?: string | string[] } }) {
    const message = error.error?.message;
    this.message.set(Array.isArray(message) ? message.join(', ') : message ?? 'Wystapil blad.');
  }
}
