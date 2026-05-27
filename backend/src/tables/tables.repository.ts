import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TablesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.restaurantTable.findMany({
      orderBy: { number: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.restaurantTable.findUnique({
      where: { id },
    });
  }
}
