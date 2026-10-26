import { DataSource } from 'typeorm';
import { Application } from '../entities/application.entity';
import { Feature } from '../entities/feature.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { Dependency } from '../entities/dependency.entity';
import { ReleaseChecklistItem } from '../entities/release-checklist-item.entity';
import { ExternalLink } from '../entities/external-link.entity';
import { AttributeDefinition } from '../entities/attribute-definition.entity';
import { InitSchema1700000000000 } from './migrations/1700000000000-InitSchema';

export const entities = [
  Application,
  Feature,
  FeatureFlag,
  Dependency,
  ReleaseChecklistItem,
  ExternalLink,
  AttributeDefinition,
];

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities,
  migrations: [InitSchema1700000000000],
  synchronize: false,
});
