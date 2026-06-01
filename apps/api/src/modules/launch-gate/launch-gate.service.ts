import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PRISMA } from '../../common/prisma.module';
import type { PrismaClient } from '@prisma/client';

/**
 * The launch gate keeps live classes off until BOTH conditions are true:
 *   1. The number of paying-or-reserved students is >= minMembers
 *   2. Today's date is on or after the launch date
 *
 * The minMembers + launchDate live in the LaunchGateConfig table so they can be
 * adjusted from the admin panel without redeploying. Env vars are fallbacks.
 */
@Injectable()
export class LaunchGateService {
  private readonly logger = new Logger(LaunchGateService.name);

  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly config: ConfigService,
  ) {}

  async getStatus() {
    const cfg = await this.resolveConfig();

    const reservations = await this.prisma.student.count({
      where: { onboardedAt: { not: null } },
    });

    const now = new Date();
    const dateMet = now >= cfg.targetLaunchDate;
    const memberCountMet = reservations >= cfg.minMembers;
    const canLaunch = dateMet && memberCountMet;

    return {
      reservations,
      minMembers: cfg.minMembers,
      targetLaunchDate: cfg.targetLaunchDate.toISOString(),
      isLaunched: cfg.isLaunched,
      memberCountMet,
      dateMet,
      canLaunch,
      seatsLeft: Math.max(0, cfg.minMembers - reservations),
    };
  }

  /** Called once a day by a cron — flips isLaunched=true the moment both conditions hold. */
  async maybeLaunch(): Promise<boolean> {
    const cfg = await this.resolveConfig();
    if (cfg.isLaunched) return false;

    const status = await this.getStatus();
    if (!status.canLaunch) return false;

    await this.prisma.launchGateConfig.update({
      where: { id: cfg.id },
      data: { isLaunched: true, launchedAt: new Date() },
    });
    this.logger.warn(`🚀 Launch gate satisfied — Ananta is live!`);
    return true;
  }

  private async resolveConfig() {
    let cfg = await this.prisma.launchGateConfig.findFirst();
    if (!cfg) {
      cfg = await this.prisma.launchGateConfig.create({
        data: {
          minMembers: Number(this.config.get('LAUNCH_GATE_MIN_MEMBERS', 10)),
          targetLaunchDate: new Date(this.config.get('LAUNCH_DATE', '2026-07-01')),
          isLaunched: false,
        },
      });
    }
    return cfg;
  }
}
