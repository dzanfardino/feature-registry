import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE applications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL,
        description text NOT NULL DEFAULT '',
        slug varchar NOT NULL UNIQUE,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE features (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL,
        description text NOT NULL DEFAULT '',
        status varchar NOT NULL,
        owner varchar NOT NULL,
        team varchar NOT NULL,
        "applicationId" uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        "customAttributes" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE feature_flags (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "featureId" uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
        owner varchar NOT NULL,
        "expectedSunsetAt" timestamptz,
        "issueUrl" varchar,
        status varchar NOT NULL,
        "customAttributes" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE dependencies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "fromFeatureId" uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
        "toFeatureId" uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
        "fromTeam" varchar NOT NULL,
        "toTeam" varchar NOT NULL,
        kind varchar NOT NULL DEFAULT 'blocks',
        notes text NOT NULL DEFAULT '',
        "customAttributes" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE release_checklist_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "featureId" uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
        title varchar NOT NULL,
        kind varchar NOT NULL,
        status varchar NOT NULL,
        "dueAt" timestamptz,
        "customAttributes" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE external_links (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "entityType" varchar NOT NULL,
        "entityId" uuid NOT NULL,
        provider varchar NOT NULL,
        type varchar NOT NULL,
        url varchar NOT NULL,
        "externalId" varchar,
        title varchar,
        metadata jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_external_links_entity ON external_links ("entityType", "entityId")`,
    );
    await queryRunner.query(`
      CREATE TABLE attribute_definitions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key varchar NOT NULL,
        label varchar NOT NULL,
        description text,
        "dataType" varchar NOT NULL,
        required boolean NOT NULL DEFAULT false,
        "defaultValue" jsonb,
        options jsonb,
        "appliesTo" varchar NOT NULL,
        validation jsonb NOT NULL DEFAULT '{}'::jsonb,
        "sortOrder" int NOT NULL DEFAULT 0,
        status varchar NOT NULL DEFAULT 'active',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("appliesTo", key)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS attribute_definitions`);
    await queryRunner.query(`DROP TABLE IF EXISTS external_links`);
    await queryRunner.query(`DROP TABLE IF EXISTS release_checklist_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS dependencies`);
    await queryRunner.query(`DROP TABLE IF EXISTS feature_flags`);
    await queryRunner.query(`DROP TABLE IF EXISTS features`);
    await queryRunner.query(`DROP TABLE IF EXISTS applications`);
  }
}
