import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CustomAttributeValues } from '@feature-registry/shared';
import { Feature } from './feature.entity';

@Entity({ name: 'dependencies' })
export class Dependency {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fromFeatureId!: string;

  @Column()
  toFeatureId!: string;

  @ManyToOne(() => Feature, (feature) => feature.outgoingDependencies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fromFeatureId' })
  fromFeature!: Feature;

  @ManyToOne(() => Feature, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'toFeatureId' })
  toFeature!: Feature;

  @Column()
  fromTeam!: string;

  @Column()
  toTeam!: string;

  @Column({ default: 'blocks' })
  kind!: string;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ type: 'jsonb', default: {} })
  customAttributes!: CustomAttributeValues;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
