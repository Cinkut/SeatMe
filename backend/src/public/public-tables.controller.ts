import { Controller, Get } from '@nestjs/common';
import { TablesService } from '../tables/tables.service';

@Controller('public/tables')
export class PublicTablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll() {
    return this.tablesService.findAll();
  }
}
