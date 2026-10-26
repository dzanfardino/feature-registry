import 'reflect-metadata';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { entities } from './database/data-source';
import { Application } from './entities/application.entity';
import { Feature } from './entities/feature.entity';
import { FeatureFlag } from './entities/feature-flag.entity';
import { ReleaseChecklistItem } from './entities/release-checklist-item.entity';
import { AttributeDefinition } from './entities/attribute-definition.entity';
import { ExternalLink } from './entities/external-link.entity';

function loadEnv() {
  const file = resolve(__dirname, '../../../.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

async function seed() {
  loadEnv();
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://feature_registry:feature_registry@localhost:5432/feature_registry',
    entities,
    synchronize: true,
  });
  await dataSource.initialize();

  const applications = dataSource.getRepository(Application);
  const features = dataSource.getRepository(Feature);
  const flags = dataSource.getRepository(FeatureFlag);
  const checklist = dataSource.getRepository(ReleaseChecklistItem);
  const definitions = dataSource.getRepository(AttributeDefinition);
  const links = dataSource.getRepository(ExternalLink);

  let app = await applications.findOne({ where: { slug: 'sample-app' } });
  if (!app) {
    app = await applications.save(
      applications.create({
        name: 'Sample App',
        description: 'Seeded application used to explore Feature Registry.',
        slug: 'sample-app',
      }),
    );
  }

  let definition = await definitions.findOne({
    where: { key: 'business_capability', appliesTo: 'Feature' },
  });
  if (!definition) {
    definition = await definitions.save(
      definitions.create({
        key: 'business_capability',
        label: 'Business capability',
        description: 'Product area this feature belongs to',
        dataType: 'enum',
        required: false,
        defaultValue: 'other',
        options: ['payments', 'onboarding', 'search', 'other'],
        appliesTo: 'Feature',
        validation: {},
        sortOrder: 10,
        status: 'active',
      }),
    );
  }

  let feature = await features.findOne({ where: { name: 'Checkout redesign', applicationId: app.id } });
  if (!feature) {
    feature = await features.save(
      features.create({
        name: 'Checkout redesign',
        description: 'Replace the legacy checkout with a modular flow.',
        status: 'in_progress',
        owner: 'Alex Rivera',
        team: 'payments',
        applicationId: app.id,
        customAttributes: { business_capability: 'payments' },
      }),
    );
  }

  const existingFlag = await flags.findOne({ where: { featureId: feature.id } });
  if (!existingFlag) {
    await flags.save(
      flags.create({
        featureId: feature.id,
        owner: 'Alex Rivera',
        expectedSunsetAt: new Date(Date.now() - 86400000),
        issueUrl: 'https://example.invalid/browse/PAY-42',
        status: 'active',
        customAttributes: {},
      }),
    );
  }

  const existingItem = await checklist.findOne({ where: { featureId: feature.id } });
  if (!existingItem) {
    await checklist.save(
      checklist.create({
        featureId: feature.id,
        title: 'Train support on the new checkout',
        kind: 'training',
        status: 'pending',
        dueAt: new Date(Date.now() + 7 * 86400000),
        customAttributes: {},
      }),
    );
  }

  const existingLink = await links.findOne({ where: { entityId: feature.id, entityType: 'Feature' } });
  if (!existingLink) {
    await links.save(
      links.create({
        entityType: 'Feature',
        entityId: feature.id,
        provider: 'generic',
        type: 'other',
        url: 'https://example.invalid/docs/checkout',
        title: 'Checkout design notes',
        metadata: { source: 'stored-url' },
      }),
    );
  }

  await dataSource.destroy();
  // eslint-disable-next-line no-console
  console.log('Seed complete.');
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
