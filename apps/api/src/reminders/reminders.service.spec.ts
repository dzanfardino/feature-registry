import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { RemindersService } from './reminders.module';

describe('RemindersService.formatPayload', () => {
  const service = new RemindersService(
    { find: async () => [] } as never,
    { find: async () => [] } as never,
    { get: () => undefined } as unknown as ConfigService,
    {} as SchedulerRegistry,
  );

  const payload = {
    generatedAt: '2026-01-01T00:00:00.000Z',
    overdueFlags: [],
    pendingChecklistItems: [],
  };

  it('uses Slack text payload for Slack webhooks', () => {
    const body = service.formatPayload('https://hooks.slack.com/services/xxx', payload);
    expect(body).toEqual({ text: expect.stringContaining('Feature Registry reminders') });
  });

  it('includes structured data for generic webhooks', () => {
    const body = service.formatPayload('https://example.com/hook', payload);
    expect(body.overdueFlags).toEqual([]);
    expect(body.text).toContain('Overdue flags');
  });
});
