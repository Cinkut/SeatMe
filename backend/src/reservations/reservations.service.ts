import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { TablesRepository } from '../tables/tables.repository';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { OccupancySlotDto } from './dto/occupancy-response.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import {
  RESERVATION_CANCELLED_EVENT,
  RESERVATION_CREATED_EVENT,
  ReservationEventPayload,
} from './events/reservation.events';
import { ReservationsRepository } from './reservations.repository';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly reservationsRepository: ReservationsRepository,
    private readonly tablesRepository: TablesRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(): Promise<ReservationResponseDto[]> {
    await this.expirePastReservations();
    const reservations = await this.reservationsRepository.findAll();
    return reservations.map(ReservationResponseDto.fromEntity);
  }

  async findOne(id: number): Promise<ReservationResponseDto> {
    await this.expirePastReservations();
    const reservation = await this.reservationsRepository.findById(id);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return ReservationResponseDto.fromEntity(reservation);
  }

  async findOccupancy(): Promise<OccupancySlotDto[]> {
    await this.expirePastReservations();
    const reservations = await this.reservationsRepository.findAll();
    return reservations
      .filter((reservation) => reservation.status === ReservationStatus.ACTIVE)
      .map((reservation) => ({
        tableId: reservation.tableId,
        startTime: reservation.startTime.toISOString(),
        endTime: reservation.endTime.toISOString(),
        status: reservation.status,
      }));
  }

  async findByPhone(phone: string): Promise<ReservationResponseDto[]> {
    await this.expirePastReservations();
    const normalizedPhone = this.normalizePhone(phone);
    if (normalizedPhone.length < 9) {
      throw new BadRequestException('Podaj poprawny numer telefonu');
    }

    const reservations = await this.reservationsRepository.findAll();
    return reservations
      .filter((reservation) => this.normalizePhone(reservation.customerPhone) === normalizedPhone)
      .map(ReservationResponseDto.fromEntity);
  }

  async cancelByCustomer(id: number, phone: string): Promise<ReservationResponseDto> {
    await this.expirePastReservations();
    const current = await this.reservationsRepository.findById(id);
    if (!current) {
      throw new NotFoundException('Reservation not found');
    }

    if (this.normalizePhone(current.customerPhone) !== this.normalizePhone(phone)) {
      throw new ForbiddenException('Numer telefonu nie pasuje do tej rezerwacji');
    }

    if (current.status !== ReservationStatus.ACTIVE) {
      throw new BadRequestException('Rezerwacji nie mozna juz anulowac');
    }

    return this.cancel(id);
  }

  async create(dto: CreateReservationDto): Promise<ReservationResponseDto> {
    await this.expirePastReservations();
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    const reservation = await this.runSerializableTransaction(async (tx) => {
      await this.reservationsRepository.expirePastReservations(tx);
      await this.validateReservation(dto.tableId, dto.guestCount, startTime, endTime, undefined, tx);

      return this.reservationsRepository.create(
        {
          tableId: dto.tableId,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          guestCount: dto.guestCount,
          startTime,
          endTime,
          note: dto.note,
        },
        tx,
      );
    });

    this.eventEmitter.emit(RESERVATION_CREATED_EVENT, this.toEventPayload(reservation));
    return ReservationResponseDto.fromEntity(reservation);
  }

  async update(id: number, dto: UpdateReservationDto): Promise<ReservationResponseDto> {
    await this.expirePastReservations();
    const reservation = await this.runSerializableTransaction(async (tx) => {
      await this.reservationsRepository.expirePastReservations(tx);
      const current = await this.reservationsRepository.findById(id, tx);
      if (!current) {
        throw new NotFoundException('Reservation not found');
      }

      const tableId = dto.tableId ?? current.tableId;
      const guestCount = dto.guestCount ?? current.guestCount;
      const startTime = dto.startTime ? new Date(dto.startTime) : current.startTime;
      const endTime = dto.endTime ? new Date(dto.endTime) : current.endTime;

      await this.validateReservation(tableId, guestCount, startTime, endTime, id, tx);

      return this.reservationsRepository.update(
        id,
        {
          tableId,
          customerName: dto.customerName ?? current.customerName,
          customerPhone: dto.customerPhone ?? current.customerPhone,
          guestCount,
          startTime,
          endTime,
          note: dto.note ?? current.note,
        },
        tx,
      );
    });

    return ReservationResponseDto.fromEntity(reservation);
  }

  async cancel(id: number): Promise<ReservationResponseDto> {
    await this.expirePastReservations();
    const current = await this.reservationsRepository.findById(id);
    if (!current) {
      throw new NotFoundException('Reservation not found');
    }

    if (current.status !== ReservationStatus.ACTIVE) {
      throw new BadRequestException('Rezerwacji nie mozna juz anulowac');
    }

    const reservation = await this.reservationsRepository.update(id, {
      status: ReservationStatus.CANCELLED,
    });

    this.eventEmitter.emit(RESERVATION_CANCELLED_EVENT, this.toEventPayload(reservation));
    return ReservationResponseDto.fromEntity(reservation);
  }

  private async validateReservation(
    tableId: number,
    guestCount: number,
    startTime: Date,
    endTime: Date,
    ignoredReservationId?: number,
    tx?: Prisma.TransactionClient,
  ) {
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid reservation date');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('Reservation end time must be after start time');
    }

    const table = await this.tablesRepository.findById(tableId, tx);
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (guestCount > table.capacity) {
      throw new BadRequestException('Guest count exceeds table capacity');
    }

    const overlapping = await this.reservationsRepository.findOverlapping(
      tableId,
      startTime,
      endTime,
      ignoredReservationId,
      tx,
    );
    if (overlapping) {
      throw new ConflictException('Table is already reserved in this time range');
    }
  }

  private async runSerializableTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(callback, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('Reservation conflict, please try again');
      }

      throw error;
    }
  }

  private async expirePastReservations() {
    await this.reservationsRepository.expirePastReservations();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private toEventPayload(reservation: {
    id: number;
    tableId: number;
    customerName: string;
    startTime: Date;
    endTime: Date;
  }): ReservationEventPayload {
    return {
      reservationId: reservation.id,
      tableId: reservation.tableId,
      customerName: reservation.customerName,
      startTime: reservation.startTime.toISOString(),
      endTime: reservation.endTime.toISOString(),
    };
  }
}
