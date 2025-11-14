import { Module } from '@nestjs/common';
import { TravelController } from './travel.controller';
import { TravelService } from './travel.service';
import { TravelExpenseService } from './travel-expense.service';
import { MetaModule } from '../meta/meta.module';

@Module({
  imports: [MetaModule],
  controllers: [TravelController],
  providers: [TravelService, TravelExpenseService],
  exports: [TravelService, TravelExpenseService],
})
export class TravelModule {}
