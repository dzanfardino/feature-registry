import { Module } from '@nestjs/common';
import { ConfluenceProvider } from './confluence.provider';
import { GenericProvider } from './generic.provider';
import { IntegrationsService } from './integrations.service';
import { JiraProvider } from './jira.provider';

@Module({
  providers: [GenericProvider, JiraProvider, ConfluenceProvider, IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
