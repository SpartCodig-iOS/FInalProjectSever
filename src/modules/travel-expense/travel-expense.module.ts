import { Module } from '@nestjs/common';
import { TravelExpenseController } from './travel-expense.controller';
import { TravelExpenseService } from './travel-expense.service';
import { MetaModule } from '../meta/meta.module';

@Module({
  imports: [MetaModule],
  controllers: [TravelExpenseController],
  providers: [TravelExpenseService],
  exports: [TravelExpenseService],
})
export class TravelExpenseModule {}
