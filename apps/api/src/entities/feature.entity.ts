import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { CustomAttributeValues, FeatureStatus } from '@feature-registry/shared';
import { Application } from './application.entity';
import { FeatureFlag } from './feature-flag.entity';
import { Dependency } from './dependency.entity';
import { ReleaseChecklistItem } from './release-checklist-item.entity';

@Entity({ name: 'features' })
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'varchar' })
  status!: FeatureStatus;

  @Column()
  owner!: string;

  @Column()
  team!: string;

  @Column()
  applicationId!: string;

  @ManyToOne(() => Application, (application) => application.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application!: Application;

  @Column({ type: 'jsonb', default: {} })
  customAttributes!: CustomAttributeValues;

  @OneToMany(() => FeatureFlag, (flag) => flag.feature)
  flags!: FeatureFlag[];

  @OneToMany(() => Dependency, (dependency) => dependency.fromFeature)
  outgoingDependencies!: Dependency[];

  @OneToMany(() => ReleaseChecklistItem, (item) => item.feature)
  checklistItems!: ReleaseChecklistItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
