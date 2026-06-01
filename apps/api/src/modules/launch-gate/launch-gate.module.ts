import { Module } from '@nestjs/common';
import { LaunchGateController } from './launch-gate.controller';
import { LaunchGateService } from './launch-gate.service';

@Module({
  controllers: [LaunchGateController],
  providers: [LaunchGateService],
  exports: [LaunchGateService],
})
export class LaunchGateModule {}
