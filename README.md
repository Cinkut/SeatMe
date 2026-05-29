# SeatMe

System rezerwacji stolikow w restauracji — NestJS, PostgreSQL, Angular.

## Stack

- Backend: NestJS, TypeScript, Prisma, PostgreSQL
- Frontend: Angular
- Security: JWT (panel admina)
- Events: NestJS EventEmitter + WebSocket (Socket.io)
- Tests: Jest

## Funkcje

- publiczna rezerwacja bez logowania (klient)
- panel admina z JWT (`/admin`)
- mapa sali z kolorami dostepnosci stolikow
- CRUD rezerwacji, statusy: `ACTIVE`, `CANCELLED`, `COMPLETED`
- DTO + walidacja, globalna obsluga bledow
- warstwy controller / service / repository
- transakcja Serializable — ochrona przed podwojna rezerwacja tego samego stolika
- eventy `reservation.created` i `reservation.cancelled` (audyt + live odswiezenie UI)
- testy jednostkowe serwisu rezerwacji

## Uruchomienie

```bash
docker compose up -d
npm install
npm run install:all
cp backend/.env.example backend/.env   # Windows: copy backend\.env.example backend\.env
npm run db:push
npm run db:seed
npm run dev
```

- Backend: `http://localhost:3000/api`
- Frontend: `http://localhost:4200`

## Uzytkownicy

| Rola   | Adres                    | Dostep                                      |
|--------|--------------------------|---------------------------------------------|
| Klient | `http://localhost:4200/` | mapa, formularz, „Moje rezerwacje” (telefon) |
| Admin  | `http://localhost:4200/admin` | JWT, lista wszystkich rezerwacji      |

Konto admina tworzy `npm run db:seed` (szczegoly w `backend/prisma/seed.ts`).

## Testy

```bash
npm test --prefix backend
```
