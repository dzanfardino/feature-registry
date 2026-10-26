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
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { FEATURE_STATUSES } from '@feature-registry/shared';
import { Feature } from '../entities/feature.entity';
import { AttributesModule } from '../attributes/attributes.module';
import { AttributesPersistence } from '../attributes/attributes.persistence';
import { ExternalLink } from '../entities/external-link.entity';

export class CreateFeatureDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn([...FEATURE_STATUSES])
  status?: (typeof FEATURE_STATUSES)[number];

  @IsString()
  owner!: string;

  @IsString()
  team!: string;

  @IsUUID()
  applicationId!: string;
}

export class UpdateFeatureDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn([...FEATURE_STATUSES])
  status?: (typeof FEATURE_STATUSES)[number];

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  team?: string;
}

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(Feature) private readonly repo: Repository<Feature>,
    @InjectRepository(ExternalLink) private readonly links: Repository<ExternalLink>,
    private readonly attributesPersistence: AttributesPersistence,
  ) {}

  findAll(query: Record<string, string | undefined>) {
    const qb = this.repo.createQueryBuilder('feature').orderBy('feature.name', 'ASC');
    if (query.applicationId) {
      qb.andWhere('feature.applicationId = :applicationId', { applicationId: query.applicationId });
    }
    if (query.status) {
      qb.andWhere('feature.status = :status', { status: query.status });
    }
    if (query.team) {
      qb.andWhere('feature.team = :team', { team: query.team });
    }
    if (query.owner) {
      qb.andWhere('feature.owner = :owner', { owner: query.owner });
    }
    this.attributesPersistence.applyFilters(qb, 'feature', this.attributesPersistence.extractQueryFilters(query));
    return qb.getMany();
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['application', 'flags', 'outgoingDependencies', 'outgoingDependencies.toFeature', 'checklistItems'],
    });
    if (!entity) throw new NotFoundException('Feature not found');
    const links = await this.links.find({ where: { entityType: 'Feature', entityId: id } });
    return { ...entity, links };
  }

  create(dto: CreateFeatureDto) {
    const entity = this.repo.create({
      ...dto,
      description: dto.description ?? '',
      status: dto.status ?? 'draft',
      customAttributes: {},
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateFeatureDto) {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException('Feature not found');
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException('Feature not found');
    await this.repo.remove(entity);
    return { deleted: true };
  }
}

@Controller('features')
export class FeaturesController {
  constructor(private readonly features: FeaturesService) {}

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.features.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.features.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFeatureDto) {
    return this.features.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFeatureDto) {
    return this.features.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.features.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Feature, ExternalLink]), AttributesModule],
  controllers: [FeaturesController],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class FeaturesModule {}
