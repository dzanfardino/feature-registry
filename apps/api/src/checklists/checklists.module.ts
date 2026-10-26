import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { Repository } from 'typeorm';
import { CHECKLIST_KINDS, CHECKLIST_STATUSES } from '@feature-registry/shared';
import { ReleaseChecklistItem } from '../entities/release-checklist-item.entity';
import { AttributesModule } from '../attributes/attributes.module';
import { AttributesPersistence } from '../attributes/attributes.persistence';

export class CreateChecklistItemDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsIn([...CHECKLIST_KINDS])
  kind?: (typeof CHECKLIST_KINDS)[number];

  @IsOptional()
  @IsIn([...CHECKLIST_STATUSES])
  status?: (typeof CHECKLIST_STATUSES)[number];

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn([...CHECKLIST_KINDS])
  kind?: (typeof CHECKLIST_KINDS)[number];

  @IsOptional()
  @IsIn([...CHECKLIST_STATUSES])
  status?: (typeof CHECKLIST_STATUSES)[number];

  @IsOptional()
  @IsDateString()
  dueAt?: string | null;
}

@Injectable()
export class ChecklistsService {
  constructor(
    @InjectRepository(ReleaseChecklistItem) private readonly repo: Repository<ReleaseChecklistItem>,
    private readonly attributesPersistence: AttributesPersistence,
  ) {}

  findAll(query: Record<string, string | undefined>) {
    const qb = this.repo.createQueryBuilder('item').orderBy('item.createdAt', 'DESC');
    if (query.featureId) qb.andWhere('item.featureId = :featureId', { featureId: query.featureId });
    if (query.status) qb.andWhere('item.status = :status', { status: query.status });
    this.attributesPersistence.applyFilters(
      qb,
      'item',
      this.attributesPersistence.extractQueryFilters(query),
    );
    return qb.getMany();
  }

  findByFeature(featureId: string) {
    return this.repo.find({ where: { featureId }, order: { createdAt: 'ASC' } });
  }

  async findOne(id: string) {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException('Checklist item not found');
    return entity;
  }

  create(featureId: string, dto: CreateChecklistItemDto) {
    const entity = this.repo.create({
      featureId,
      title: dto.title,
      kind: dto.kind ?? 'other',
      status: dto.status ?? 'pending',
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      customAttributes: {},
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateChecklistItemDto) {
    const entity = await this.findOne(id);
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.kind !== undefined) entity.kind = dto.kind;
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.dueAt !== undefined) entity.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { deleted: true };
  }
}

@Controller()
export class ChecklistsController {
  constructor(private readonly checklists: ChecklistsService) {}

  @Get('checklist-items')
  findAll(@Query() query: Record<string, string>) {
    return this.checklists.findAll(query);
  }

  @Get('features/:featureId/checklist')
  findByFeature(@Param('featureId') featureId: string) {
    return this.checklists.findByFeature(featureId);
  }

  @Post('features/:featureId/checklist')
  create(@Param('featureId') featureId: string, @Body() dto: CreateChecklistItemDto) {
    return this.checklists.create(featureId, dto);
  }

  @Patch('checklist-items/:id')
  update(@Param('id') id: string, @Body() dto: UpdateChecklistItemDto) {
    return this.checklists.update(id, dto);
  }

  @Delete('checklist-items/:id')
  remove(@Param('id') id: string) {
    return this.checklists.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([ReleaseChecklistItem]), AttributesModule],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
