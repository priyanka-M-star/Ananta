import { Module } from '@nestjs/common';
import { MemoryDeckController } from './memory-deck.controller';
import { MemoryDeckService } from './memory-deck.service';

@Module({
  controllers: [MemoryDeckController],
  providers: [MemoryDeckService],
})
export class MemoryDeckModule {}
