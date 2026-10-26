import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrichedLink, ExternalLinkInput, ExternalLinkProvider } from './external-link.provider';

@Injectable()
export class ConfluenceProvider implements ExternalLinkProvider {
  readonly provider = 'confluence' as const;
  private readonly logger = new Logger(ConfluenceProvider.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get('CONFLUENCE_BASE_URL') && this.config.get('CONFLUENCE_API_TOKEN'));
  }

  async enrich(link: ExternalLinkInput): Promise<EnrichedLink> {
    if (!this.isConfigured()) {
      return { ...link, metadata: null };
    }

    const pageId = link.externalId || this.extractPageId(link.url);
    if (!pageId) {
      return { ...link, metadata: { warning: 'Could not determine Confluence page id' } };
    }

    try {
      const base = this.config.get<string>('CONFLUENCE_BASE_URL')!.replace(/\/$/, '');
      const email = this.config.get<string>('CONFLUENCE_EMAIL') ?? '';
      const token = this.config.get<string>('CONFLUENCE_API_TOKEN')!;
      const auth = Buffer.from(`${email}:${token}`).toString('base64');
      const response = await fetch(`${base}/wiki/api/v2/pages/${encodeURIComponent(pageId)}`, {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        this.logger.warn(`Confluence enrichment failed: ${response.status}`);
        return { ...link, externalId: pageId, metadata: { status: response.status } };
      }
      const payload = (await response.json()) as { id?: string; title?: string; status?: string };
      return {
        ...link,
        externalId: payload.id ?? pageId,
        title: payload.title ?? link.title,
        metadata: {
          title: payload.title,
          status: payload.status,
        },
      };
    } catch (error) {
      this.logger.warn(`Confluence enrichment error: ${(error as Error).message}`);
      return { ...link, externalId: pageId, metadata: { error: (error as Error).message } };
    }
  }

  private extractPageId(url: string): string | null {
    const fromQuery = url.match(/[?&]pageId=(\d+)/);
    if (fromQuery) return fromQuery[1];
    const fromPath = url.match(/pages\/(\d+)/);
    return fromPath?.[1] ?? null;
  }
}
