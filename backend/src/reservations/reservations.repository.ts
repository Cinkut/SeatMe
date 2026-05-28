import { Injectable } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(client: PrismaClientLike = this.prisma) {
    return client.reservation.findMany({
      include: { table: true },
      orderBy: { startTime: 'asc' },
    });
  }

  findById(id: number, client: PrismaClientLike = this.prisma) {
    return client.reservation.findUnique({
      where: { id },
      include: { table: true },
    });
  }

  create(data: Prisma.ReservationUncheckedCreateInput, client: PrismaClientLike = this.prisma) {
    return client.reservation.create({
      data,
      include: { table: true },
    });
  }

  update(id: number, data: Prisma.ReservationUncheckedUpdateInput, client: PrismaClientLike = this.prisma) {
    return client.reservation.update({
      where: { id },
      data,
      include: { table: true },
    });
  }

  findOverlapping(
    tableId: number,
    startTime: Date,
    endTime: Date,
    ignoredReservationId?: number,
    client: PrismaClientLike = this.prisma,
  ) {
    return client.reservation.findFirst({
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
