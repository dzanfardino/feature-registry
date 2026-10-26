import { Injectable } from '@nestjs/common';
import { EnrichedLink, ExternalLinkInput, ExternalLinkProvider } from './external-link.provider';
import { GenericProvider } from './generic.provider';
import { JiraProvider } from './jira.provider';
import { ConfluenceProvider } from './confluence.provider';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly generic: GenericProvider,
    private readonly jira: JiraProvider,
    private readonly confluence: ConfluenceProvider,
  ) {}

  async enrich(link: ExternalLinkInput): Promise<EnrichedLink> {
    const provider = this.select(link);
    return provider.enrich(link);
  }

  private select(link: ExternalLinkInput): ExternalLinkProvider {
    if (link.provider === 'jira' && this.jira.isConfigured()) return this.jira;
    if (link.provider === 'confluence' && this.confluence.isConfigured()) return this.confluence;
    return this.generic;
  }
}
