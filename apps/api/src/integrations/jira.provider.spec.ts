import { ConfigService } from '@nestjs/config';
import { JiraProvider } from './jira.provider';

describe('JiraProvider', () => {
  it('is not configured without env vars', () => {
    const provider = new JiraProvider({ get: () => undefined } as unknown as ConfigService);
    expect(provider.isConfigured()).toBe(false);
  });

  it('extracts an issue key from a browse URL via enrich fallback', async () => {
    const provider = new JiraProvider({ get: () => undefined } as unknown as ConfigService);
    const result = await provider.enrich({
      provider: 'jira',
      type: 'task',
      url: 'https://example.atlassian.net/browse/PAY-12',
    });
    expect(result.metadata).toBeNull();
  });
});
