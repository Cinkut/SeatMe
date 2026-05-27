import { Injectable } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.reservation.findMany({
      include: { table: true },
      orderBy: { startTime: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });
  }

  create(data: Prisma.ReservationUncheckedCreateInput) {
    return this.prisma.reservation.create({
      data,
      include: { table: true },
    });
  }

  update(id: number, data: Prisma.ReservationUncheckedUpdateInput) {
    return this.prisma.reservation.update({
      where: { id },
      data,
      include: { table: true },
    });
  }

  findOverlapping(tableId: number, startTime: Date, endTime: Date, ignoredReservationId?: number) {
    return this.prisma.reservation.findFirst({
      where: {
        tableId,
        status: ReservationStatus.ACTIVE,
        id: ignoredReservationId ? { not: ignoredReservationId } : undefined,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
  }
}
