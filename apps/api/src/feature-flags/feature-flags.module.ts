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
import { IsDateString, IsIn, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import { Repository } from 'typeorm';
import { FLAG_STATUSES } from '@feature-registry/shared';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { AttributesModule } from '../attributes/attributes.module';
import { AttributesPersistence } from '../attributes/attributes.persistence';

export class CreateFeatureFlagDto {
  @IsString()
  owner!: string;

  @IsOptional()
  @IsDateString()
  expectedSunsetAt?: string;

  @IsOptional()
  @ValidateIf((_, value) => Boolean(value))
  @IsUrl({ require_tld: false })
  issueUrl?: string;

  @IsOptional()
  @IsIn([...FLAG_STATUSES])
  status?: (typeof FLAG_STATUSES)[number];
}

export class UpdateFeatureFlagDto {
  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsDateString()
  expectedSunsetAt?: string | null;

  @IsOptional()
  @IsString()
  issueUrl?: string | null;

  @IsOptional()
  @IsIn([...FLAG_STATUSES])
  status?: (typeof FLAG_STATUSES)[number];
}

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag) private readonly repo: Repository<FeatureFlag>,
    private readonly attributesPersistence: AttributesPersistence,
  ) {}

  findAll(query: Record<string, string | undefined>) {
    const qb = this.repo.createQueryBuilder('flag').orderBy('flag.createdAt', 'DESC');
    if (query.featureId) qb.andWhere('flag.featureId = :featureId', { featureId: query.featureId });
    if (query.status) qb.andWhere('flag.status = :status', { status: query.status });
    this.attributesPersistence.applyFilters(
      qb,
      'flag',
      this.attributesPersistence.extractQueryFilters(query),
    );
    return qb.getMany();
  }

  findByFeature(featureId: string) {
    return this.repo.find({ where: { featureId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id }, relations: ['feature'] });
    if (!entity) throw new NotFoundException('Feature flag not found');
    return entity;
  }

  create(featureId: string, dto: CreateFeatureFlagDto) {
    const entity = this.repo.create({
      featureId,
      owner: dto.owner,
      expectedSunsetAt: dto.expectedSunsetAt ? new Date(dto.expectedSunsetAt) : null,
      issueUrl: dto.issueUrl ?? null,
      status: dto.status ?? 'active',
      customAttributes: {},
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateFeatureFlagDto) {
    const entity = await this.findOne(id);
    if (dto.owner !== undefined) entity.owner = dto.owner;
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.issueUrl !== undefined) entity.issueUrl = dto.issueUrl;
    if (dto.expectedSunsetAt !== undefined) {
      entity.expectedSunsetAt = dto.expectedSunsetAt ? new Date(dto.expectedSunsetAt) : null;
    }
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { deleted: true };
  }
}

@Controller()
export class FeatureFlagsController {
  constructor(private readonly flags: FeatureFlagsService) {}

  @Get('flags')
  findAll(@Query() query: Record<string, string>) {
    return this.flags.findAll(query);
  }

  @Get('features/:featureId/flags')
  findByFeature(@Param('featureId') featureId: string) {
    return this.flags.findByFeature(featureId);
  }

  @Post('features/:featureId/flags')
  create(@Param('featureId') featureId: string, @Body() dto: CreateFeatureFlagDto) {
    return this.flags.create(featureId, dto);
  }

  @Get('flags/:id')
  findOne(@Param('id') id: string) {
    return this.flags.findOne(id);
  }

  @Patch('flags/:id')
  update(@Param('id') id: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.flags.update(id, dto);
  }

  @Delete('flags/:id')
  remove(@Param('id') id: string) {
    return this.flags.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([FeatureFlag]), AttributesModule],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
