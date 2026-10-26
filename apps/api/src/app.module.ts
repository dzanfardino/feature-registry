import { join } from 'node:path';
import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { entities } from './database/data-source';
import { InitSchema1700000000000 } from './database/migrations/1700000000000-InitSchema';
import { ApplicationsModule } from './applications/applications.module';
import { FeaturesModule } from './features/features.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { DependenciesModule } from './dependencies/dependencies.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { ExternalLinksModule } from './external-links/external-links.module';
import { AttributesModule } from './attributes/attributes.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { RemindersModule } from './reminders/reminders.module';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '../../../.env'), join(__dirname, '../../.env'), '.env'],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities,
        migrations: [InitSchema1700000000000],
        synchronize: config.get('TYPEORM_SYNC') === 'true',
        migrationsRun: config.get('TYPEORM_SYNC') !== 'true',
      }),
    }),
    ApplicationsModule,
    FeaturesModule,
    FeatureFlagsModule,
    DependenciesModule,
    ChecklistsModule,
    ExternalLinksModule,
    AttributesModule,
    IntegrationsModule,
    RemindersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
