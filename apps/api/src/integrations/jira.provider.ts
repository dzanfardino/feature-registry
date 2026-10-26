import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrichedLink, ExternalLinkInput, ExternalLinkProvider } from './external-link.provider';

@Injectable()
export class JiraProvider implements ExternalLinkProvider {
  readonly provider = 'jira' as const;
  private readonly logger = new Logger(JiraProvider.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get('JIRA_BASE_URL') && this.config.get('JIRA_API_TOKEN'));
  }

  async enrich(link: ExternalLinkInput): Promise<EnrichedLink> {
    if (!this.isConfigured()) {
      return { ...link, metadata: null };
    }

    const issueKey = link.externalId || this.extractIssueKey(link.url);
    if (!issueKey) {
      return { ...link, metadata: { warning: 'Could not determine Jira issue key' } };
    }

    try {
      const base = this.config.get<string>('JIRA_BASE_URL')!.replace(/\/$/, '');
      const email = this.config.get<string>('JIRA_EMAIL') ?? '';
      const token = this.config.get<string>('JIRA_API_TOKEN')!;
      const auth = Buffer.from(`${email}:${token}`).toString('base64');
      const response = await fetch(`${base}/rest/api/3/issue/${encodeURIComponent(issueKey)}`, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        this.logger.warn(`Jira enrichment failed: ${response.status}`);
        return { ...link, externalId: issueKey, metadata: { status: response.status } };
      }
      const payload = (await response.json()) as {
        key: string;
        fields?: { summary?: string; status?: { name?: string } };
      };
      return {
        ...link,
        externalId: payload.key,
        title: payload.fields?.summary ?? link.title,
        metadata: {
          status: payload.fields?.status?.name,
          summary: payload.fields?.summary,
        },
      };
    } catch (error) {
      this.logger.warn(`Jira enrichment error: ${(error as Error).message}`);
      return { ...link, externalId: issueKey, metadata: { error: (error as Error).message } };
    }
  }

  private extractIssueKey(url: string): string | null {
    const match = url.match(/[A-Z][A-Z0-9]+-\d+/);
    return match?.[0] ?? null;
  }
}
