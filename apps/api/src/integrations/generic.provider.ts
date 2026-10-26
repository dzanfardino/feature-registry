import { Injectable } from '@nestjs/common';
import { EnrichedLink, ExternalLinkInput, ExternalLinkProvider } from './external-link.provider';

@Injectable()
export class GenericProvider implements ExternalLinkProvider {
  readonly provider = 'generic' as const;

  isConfigured(): boolean {
    return true;
  }

  async enrich(link: ExternalLinkInput): Promise<EnrichedLink> {
    return {
      ...link,
      metadata: { source: 'stored-url' },
    };
  }
}
