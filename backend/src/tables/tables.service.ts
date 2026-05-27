import { Injectable } from '@nestjs/common';
import { TableResponseDto } from './dto/table-response.dto';
import { TablesRepository } from './tables.repository';

@Injectable()
export class TablesService {
  constructor(private readonly tablesRepository: TablesRepository) {}

  async findAll(): Promise<TableResponseDto[]> {
    const tables = await this.tablesRepository.findAll();
    return tables.map(TableResponseDto.fromEntity);
  }
}
