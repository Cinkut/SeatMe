# SeatMe

Mini system rezerwacji stolikow w restauracji przygotowany jako projekt web app na ocene 5.0.

## Stack

- Backend: NestJS, TypeScript, Prisma, PostgreSQL
- Frontend: Angular
- Security: JWT
- Events: NestJS EventEmitter
- Tests: Jest

## Funkcje

- logowanie uzytkownika i zabezpieczone API
- CRUD rezerwacji stolikow
- realistyczna mapa sali restauracyjnej z pozycjami stolikow i kolorami dostepnosci
- DTO + walidacja danych
- globalna obsluga bledow
- warstwy controller/service/repository
- transakcja `Serializable` chroni przed podwojna rezerwacja tego samego stolika
- eventy `reservation.created` i `reservation.cancelled`
- WebSocket odswieza frontend po utworzeniu lub anulowaniu rezerwacji
- testy jednostkowe serwisu rezerwacji

## Uruchomienie

```bash
docker compose up -d
npm install
npm run install:all
cp backend/.env.example backend/.env
npm run db:push
npm run db:seed
npm run dev
```

Backend dziala domyslnie na `http://localhost:3000`, frontend na `http://localhost:4200`.

## Uzytkownicy

- **Klient (publicznie, bez logowania):** `http://localhost:4200/` — mapa stolikow, formularz rezerwacji, sekcja „Moje rezerwacje” po numerze telefonu (anulowanie wymaga tego samego numeru).
- **Admin (JWT):** `http://localhost:4200/admin` — podglad wszystkich rezerwacji i anulowanie (dostep tylko przez URL).

Konto admina tworzy seed bazy — nie wyswietlaj hasla w UI.

## Scenariusz demo

1. Uruchom baze, backend i frontend.
2. Jako klient: wejdz na `/`, zarezerwuj stolik bez logowania.
3. W „Moje rezerwacje” podaj telefon i anuluj wizyte.
4. Jako admin: wejdz na `/admin`, zaloguj sie, przejrzyj wszystkie rezerwacje.
5. Pokaz walidacje i kolizje terminu (`409 Conflict`).
6. Otworz druga karte i pokaz live odswiezenie przez WebSocket.

## Kryteria oceny

- 3.0: dzialajacy backend, baza danych, CRUD rezerwacji, demo wideo.
- 4.0: warstwy Controller/Service/Repository, DTO, walidacja, obsluga bledow, JWT.
- 5.0: testy jednostkowe, eventy aplikacyjne, mapa stolikow, WebSocket, czysty kod, Angular konsumujacy API.
