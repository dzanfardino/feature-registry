import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  ChecklistKind,
  ChecklistStatus,
  CustomAttributeValues,
} from '@feature-registry/shared';
import { Feature } from './feature.entity';

@Entity({ name: 'release_checklist_items' })
export class ReleaseChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  featureId!: string;

  @ManyToOne(() => Feature, (feature) => feature.checklistItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'featureId' })
  feature!: Feature;

  @Column()
  title!: string;

  @Column({ type: 'varchar' })
  kind!: ChecklistKind;

  @Column({ type: 'varchar' })
  status!: ChecklistStatus;

  @Column({ type: 'timestamptz', nullable: true })
  dueAt!: Date | null;

  @Column({ type: 'jsonb', default: {} })
  customAttributes!: CustomAttributeValues;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
