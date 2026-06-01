import { Controller, Get } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LaunchGateService } from './launch-gate.service';

@Controller('launch-gate')
export class LaunchGateController {
  constructor(private readonly gate: LaunchGateService) {}

  /** GET /v1/launch-gate — public; landing page reads this. */
  @Get()
  status() {
    return this.gate.getStatus();
  }

  /** Runs once a day; flips the gate the moment both conditions hold. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyCheck() {
    await this.gate.maybeLaunch();
  }
}
