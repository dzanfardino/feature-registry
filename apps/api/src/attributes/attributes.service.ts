import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AttributeEntityType, CustomAttributeValues } from '@feature-registry/shared';
import { AttributeDefinition } from '../entities/attribute-definition.entity';
import { Feature } from '../entities/feature.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { Dependency } from '../entities/dependency.entity';
import { ReleaseChecklistItem } from '../entities/release-checklist-item.entity';
import { AttributesPersistence, HasCustomAttributes } from './attributes.persistence';
import { AttributeValueValidator } from './attribute-value.validator';
import { CreateAttributeDefinitionDto, UpdateAttributeDefinitionDto } from './dto';

@Injectable()
export class AttributesService {
  private readonly validator = new AttributeValueValidator();

  constructor(
    @InjectRepository(AttributeDefinition)
    private readonly definitions: Repository<AttributeDefinition>,
    @InjectRepository(Feature) private readonly features: Repository<Feature>,
    @InjectRepository(FeatureFlag) private readonly flags: Repository<FeatureFlag>,
    @InjectRepository(Dependency) private readonly dependencies: Repository<Dependency>,
    @InjectRepository(ReleaseChecklistItem)
    private readonly checklist: Repository<ReleaseChecklistItem>,
    private readonly persistence: AttributesPersistence,
  ) {}

  listDefinitions(appliesTo?: AttributeEntityType, includeArchived = false) {
    const where: Record<string, unknown> = {};
    if (appliesTo) where.appliesTo = appliesTo;
    if (!includeArchived) where.status = 'active';
    return this.definitions.find({ where, order: { sortOrder: 'ASC', label: 'ASC' } });
  }

  createDefinition(dto: CreateAttributeDefinitionDto) {
    const entity = this.definitions.create({
      ...dto,
      description: dto.description ?? null,
      required: dto.required ?? false,
      defaultValue: dto.defaultValue ?? null,
      options: dto.options ?? null,
      validation: dto.validation ?? {},
      sortOrder: dto.sortOrder ?? 0,
      status: 'active',
    });
    return this.definitions.save(entity);
  }

  async updateDefinition(id: string, dto: UpdateAttributeDefinitionDto) {
    const entity = await this.definitions.findOneBy({ id });
    if (!entity) throw new NotFoundException('Attribute definition not found');
    Object.assign(entity, dto);
    return this.definitions.save(entity);
  }

  async archiveDefinition(id: string) {
    return this.updateDefinition(id, { status: 'archived' });
  }

  async getValues(entityType: AttributeEntityType, entityId: string) {
    const entity = await this.loadEntity(entityType, entityId);
    return this.persistence.read(entity);
  }

  async setValues(
    entityType: AttributeEntityType,
    entityId: string,
    values: CustomAttributeValues,
  ) {
    const entity = await this.loadEntity(entityType, entityId);
    const definitions = await this.listDefinitions(entityType);
    const next = this.validator.validate(definitions, {
      ...this.persistence.read(entity),
      ...values,
    });
    this.persistence.write(entity, next);
    await this.saveEntity(entityType, entity);
    return next;
  }

  private async loadEntity(
    entityType: AttributeEntityType,
    entityId: string,
  ): Promise<HasCustomAttributes & { id: string }> {
    const entity = await this.findById(entityType, entityId);
    if (!entity) throw new NotFoundException(`${entityType} not found`);
    return entity;
  }

  private findById(entityType: AttributeEntityType, id: string) {
    switch (entityType) {
      case 'Feature':
        return this.features.findOneBy({ id });
      case 'FeatureFlag':
        return this.flags.findOneBy({ id });
      case 'Dependency':
        return this.dependencies.findOneBy({ id });
      case 'ReleaseChecklistItem':
        return this.checklist.findOneBy({ id });
    }
  }

  private saveEntity(entityType: AttributeEntityType, entity: HasCustomAttributes) {
    switch (entityType) {
      case 'Feature':
        return this.features.save(entity as Feature);
      case 'FeatureFlag':
        return this.flags.save(entity as FeatureFlag);
      case 'Dependency':
        return this.dependencies.save(entity as Dependency);
      case 'ReleaseChecklistItem':
        return this.checklist.save(entity as ReleaseChecklistItem);
    }
  }
}
