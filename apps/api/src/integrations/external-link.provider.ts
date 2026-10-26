import type { LinkProvider, LinkType } from '@feature-registry/shared';

export interface ExternalLinkInput {
  provider: LinkProvider;
  type: LinkType;
  url: string;
  externalId?: string | null;
  title?: string | null;
}

export interface EnrichedLink extends ExternalLinkInput {
  metadata?: Record<string, unknown> | null;
}

export interface ExternalLinkProvider {
  readonly provider: LinkProvider;
  isConfigured(): boolean;
  enrich(link: ExternalLinkInput): Promise<EnrichedLink>;
}
