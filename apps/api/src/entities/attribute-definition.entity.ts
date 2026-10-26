import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type {
  AttributeDataType,
  AttributeEntityType,
  AttributeStatus,
  AttributeValidationRules,
} from '@feature-registry/shared';

@Entity({ name: 'attribute_definitions' })
@Unique(['appliesTo', 'key'])
export class AttributeDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  key!: string;

  @Column()
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar' })
  dataType!: AttributeDataType;

  @Column({ default: false })
  required!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  defaultValue!: unknown | null;

  @Column({ type: 'jsonb', nullable: true })
  options!: string[] | null;

  @Column({ type: 'varchar' })
  appliesTo!: AttributeEntityType;

  @Column({ type: 'jsonb', default: {} })
  validation!: AttributeValidationRules;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'varchar', default: 'active' })
  status!: AttributeStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
