import { RestaurantTable } from '@prisma/client';

export class TableResponseDto {
  id: number;
  number: number;
  capacity: number;
  location: string;

  static fromEntity(table: RestaurantTable): TableResponseDto {
    return {
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      location: table.location,
    };
  }
}
