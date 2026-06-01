import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './common/prisma.module';
import { HealthController } from './common/health.controller';

import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { LaunchGateModule } from './modules/launch-gate/launch-gate.module';
import { ClassesModule } from './modules/classes/classes.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { DoubtsModule } from './modules/doubts/doubts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,

    AuthModule,
    StudentsModule,
    LaunchGateModule,
    ClassesModule,
    QuizzesModule,
    DoubtsModule,
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
