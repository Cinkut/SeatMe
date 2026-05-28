import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class TablesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(client: PrismaClientLike = this.prisma) {
    return client.restaurantTable.findMany({
      orderBy: { number: 'asc' },
    });
  }

  findById(id: number, client: PrismaClientLike = this.prisma) {
    return client.restaurantTable.findUnique({
      where: { id },
    });
  }
}
