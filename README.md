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
- lista stolikow restauracji
- DTO + walidacja danych
- globalna obsluga bledow
- warstwy controller/service/repository
- eventy `reservation.created` i `reservation.cancelled`
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

Domyslne konto:

- email: `admin@seatme.local`
- haslo: `admin123`

## Scenariusz demo

1. Uruchom baze, backend i frontend.
2. Zaloguj sie na domyslne konto.
3. Pokaz liste stolikow.
4. Utworz rezerwacje dla wybranego stolika.
5. Pokaz walidacje, np. liczba osob wieksza niz pojemnosc stolika.
6. Pokaz blokade kolizji terminu dla tego samego stolika.
7. Anuluj rezerwacje i pokaz event w logach backendu.

## Kryteria oceny

- 3.0: dzialajacy backend, baza danych, CRUD rezerwacji, demo wideo.
- 4.0: warstwy Controller/Service/Repository, DTO, walidacja, obsluga bledow, JWT.
- 5.0: testy jednostkowe, eventy aplikacyjne, czysty kod, Angular konsumujacy API.
