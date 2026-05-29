import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReservationStatus, TableLocation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TablesRepository } from '../tables/tables.repository';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let reservationsRepository: jest.Mocked<ReservationsRepository>;
  let tablesRepository: jest.Mocked<TablesRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let prisma: jest.Mocked<PrismaService>;

  const table = {
    id: 1,
    number: 1,
    capacity: 4,
    location: TableLocation.WINDOW,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    reservationsRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findOverlapping: jest.fn(),
      expirePastReservations: jest.fn().mockResolvedValue({ count: 0 }),
    } as unknown as jest.Mocked<ReservationsRepository>;

    tablesRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<TablesRepository>;

    eventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    prisma = {
      $transaction: jest.fn((callback) => callback({})),
    } as unknown as jest.Mocked<PrismaService>;

    service = new ReservationsService(reservationsRepository, tablesRepository, eventEmitter, prisma);
  });

  it('creates a reservation and emits an event', async () => {
    tablesRepository.findById.mockResolvedValue(table);
    reservationsRepository.findOverlapping.mockResolvedValue(null);
    reservationsRepository.create.mockResolvedValue({
      id: 10,
      tableId: 1,
      table,
      customerName: 'Anna Nowak',
      customerPhone: '123456789',
      guestCount: 2,
      startTime: new Date('2026-06-01T18:00:00.000Z'),
      endTime: new Date('2026-06-01T20:00:00.000Z'),
      status: ReservationStatus.ACTIVE,
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      tableId: 1,
      customerName: 'Anna Nowak',
      customerPhone: '123456789',
      guestCount: 2,
      startTime: '2026-06-01T18:00:00.000Z',
      endTime: '2026-06-01T20:00:00.000Z',
    });

    expect(result.id).toBe(10);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'reservation.created',
      expect.objectContaining({ reservationId: 10 }),
    );
  });

  it('rejects reservations above table capacity', async () => {
    tablesRepository.findById.mockResolvedValue(table);

    await expect(
      service.create({
        tableId: 1,
        customerName: 'Anna Nowak',
        customerPhone: '123456789',
        guestCount: 8,
        startTime: '2026-06-01T18:00:00.000Z',
        endTime: '2026-06-01T20:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects overlapping reservations', async () => {
    tablesRepository.findById.mockResolvedValue(table);
    reservationsRepository.findOverlapping.mockResolvedValue({
      id: 99,
      tableId: 1,
      customerName: 'Existing',
      customerPhone: '000',
      guestCount: 2,
      startTime: new Date('2026-06-01T18:30:00.000Z'),
      endTime: new Date('2026-06-01T19:30:00.000Z'),
      status: ReservationStatus.ACTIVE,
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.create({
        tableId: 1,
        customerName: 'Anna Nowak',
        customerPhone: '123456789',
        guestCount: 2,
        startTime: '2026-06-01T18:00:00.000Z',
        endTime: '2026-06-01T20:00:00.000Z',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('cancels reservation when phone matches', async () => {
    reservationsRepository.findById.mockResolvedValue({
      id: 1,
      tableId: 1,
      table,
      customerName: 'Anna',
      customerPhone: '600-123-456',
      guestCount: 2,
      startTime: new Date(),
      endTime: new Date(),
      status: ReservationStatus.ACTIVE,
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    reservationsRepository.update.mockResolvedValue({
      id: 1,
      tableId: 1,
      table,
      customerName: 'Anna',
      customerPhone: '600-123-456',
      guestCount: 2,
      startTime: new Date(),
      endTime: new Date(),
      status: ReservationStatus.CANCELLED,
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.cancelByCustomer(1, '600123456');

    expect(result.status).toBe('CANCELLED');
  });

  it('rejects cancel when phone does not match', async () => {
    reservationsRepository.findById.mockResolvedValue({
      id: 1,
      tableId: 1,
      table,
      customerName: 'Anna',
      customerPhone: '600-123-456',
      guestCount: 2,
      startTime: new Date(),
      endTime: new Date(),
      status: ReservationStatus.ACTIVE,
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.cancelByCustomer(1, '111222333')).rejects.toThrow(ForbiddenException);
  });

  it('marks past active reservations as completed', async () => {
    reservationsRepository.expirePastReservations.mockResolvedValue({ count: 2 });
    reservationsRepository.findAll.mockResolvedValue([]);

    await service.findOccupancy();

    expect(reservationsRepository.expirePastReservations).toHaveBeenCalled();
  });
});
