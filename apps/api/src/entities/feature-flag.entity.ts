import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CustomAttributeValues, FlagStatus } from '@feature-registry/shared';
import { Feature } from './feature.entity';

@Entity({ name: 'feature_flags' })
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  featureId!: string;

  @ManyToOne(() => Feature, (feature) => feature.flags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'featureId' })
  feature!: Feature;

  @Column()
  owner!: string;

  @Column({ type: 'timestamptz', nullable: true })
  expectedSunsetAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  issueUrl!: string | null;

  @Column({ type: 'varchar' })
  status!: FlagStatus;

  @Column({ type: 'jsonb', default: {} })
  customAttributes!: CustomAttributeValues;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
