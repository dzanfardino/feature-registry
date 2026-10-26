import { Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { LessThan, Not, Repository } from 'typeorm';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { ReleaseChecklistItem } from '../entities/release-checklist-item.entity';

export interface ReminderPayload {
  generatedAt: string;
  overdueFlags: FeatureFlag[];
  pendingChecklistItems: ReleaseChecklistItem[];
}

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(FeatureFlag) private readonly flags: Repository<FeatureFlag>,
    @InjectRepository(ReleaseChecklistItem)
    private readonly checklist: Repository<ReleaseChecklistItem>,
    private readonly config: ConfigService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const expression = this.config.get<string>('REMINDER_CRON') || '0 9 * * *';
    const job = new CronJob(expression, () => {
      void this.sendReminders();
    });
    this.scheduler.addCronJob('feature-registry-reminders', job);
    job.start();
    this.logger.log(`Reminder cron registered (${expression})`);
  }

  async collect(): Promise<ReminderPayload> {
    const now = new Date();
    const overdueFlags = await this.flags.find({
      where: { expectedSunsetAt: LessThan(now), status: Not('removed') },
      relations: ['feature'],
    });
    const pendingChecklistItems = await this.checklist.find({
      where: { status: 'pending' },
      relations: ['feature'],
    });
    return {
      generatedAt: now.toISOString(),
      overdueFlags,
      pendingChecklistItems,
    };
  }

  async sendReminders(fetchImpl: typeof fetch = fetch): Promise<ReminderPayload | null> {
    const webhook = this.config.get<string>('REMINDER_WEBHOOK_URL');
    const payload = await this.collect();
    if (!webhook) {
      this.logger.debug('REMINDER_WEBHOOK_URL is not set; skipping notification');
      return payload;
    }
    if (payload.overdueFlags.length === 0 && payload.pendingChecklistItems.length === 0) {
      return payload;
    }
    const body = this.formatPayload(webhook, payload);
    await fetchImpl(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    this.logger.log(
      `Sent reminder for ${payload.overdueFlags.length} flags and ${payload.pendingChecklistItems.length} checklist items`,
    );
    return payload;
  }

  formatPayload(webhook: string, payload: ReminderPayload): Record<string, unknown> {
    const text = [
      `Feature Registry reminders (${payload.generatedAt})`,
      `Overdue flags: ${payload.overdueFlags.length}`,
      ...payload.overdueFlags.map(
        (flag) =>
          `- ${flag.feature?.name ?? flag.featureId} / owner ${flag.owner} / sunset ${flag.expectedSunsetAt?.toISOString() ?? ''}`,
      ),
      `Pending checklist items: ${payload.pendingChecklistItems.length}`,
      ...payload.pendingChecklistItems.map(
        (item) => `- ${item.title} (${item.kind}) on ${item.feature?.name ?? item.featureId}`,
      ),
    ].join('\n');

    if (webhook.includes('hooks.slack.com')) {
      return { text };
    }
    return { text, ...payload };
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([FeatureFlag, ReleaseChecklistItem])],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
