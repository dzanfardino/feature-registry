import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { AttributeEntityType, LinkProvider, LinkType } from '@feature-registry/shared';

@Entity({ name: 'external_links' })
export class ExternalLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  entityType!: AttributeEntityType;

  @Column()
  entityId!: string;

  @Column({ type: 'varchar' })
  provider!: LinkProvider;

  @Column({ type: 'varchar' })
  type!: LinkType;

  @Column()
  url!: string;

  @Column({ type: 'varchar', nullable: true })
  externalId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  title!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
