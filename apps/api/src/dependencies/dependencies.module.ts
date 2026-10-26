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
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { Dependency } from '../entities/dependency.entity';
import { AttributesModule } from '../attributes/attributes.module';
import { AttributesPersistence } from '../attributes/attributes.persistence';

export class CreateDependencyDto {
  @IsUUID()
  toFeatureId!: string;

  @IsString()
  fromTeam!: string;

  @IsString()
  toTeam!: string;

  @IsOptional()
  @IsString()
  kind?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDependencyDto {
  @IsOptional()
  @IsString()
  fromTeam?: string;

  @IsOptional()
  @IsString()
  toTeam?: string;

  @IsOptional()
  @IsString()
  kind?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Injectable()
export class DependenciesService {
  constructor(
    @InjectRepository(Dependency) private readonly repo: Repository<Dependency>,
    private readonly attributesPersistence: AttributesPersistence,
  ) {}

  findAll(query: Record<string, string | undefined>) {
    const qb = this.repo
      .createQueryBuilder('dependency')
      .leftJoinAndSelect('dependency.toFeature', 'toFeature')
      .orderBy('dependency.createdAt', 'DESC');
    if (query.fromFeatureId) {
      qb.andWhere('dependency.fromFeatureId = :fromFeatureId', { fromFeatureId: query.fromFeatureId });
    }
    this.attributesPersistence.applyFilters(
      qb,
      'dependency',
      this.attributesPersistence.extractQueryFilters(query),
    );
    return qb.getMany();
  }

  findByFeature(fromFeatureId: string) {
    return this.repo.find({
      where: { fromFeatureId },
      relations: ['toFeature'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id }, relations: ['toFeature', 'fromFeature'] });
    if (!entity) throw new NotFoundException('Dependency not found');
    return entity;
  }

  create(fromFeatureId: string, dto: CreateDependencyDto) {
    const entity = this.repo.create({
      fromFeatureId,
      toFeatureId: dto.toFeatureId,
      fromTeam: dto.fromTeam,
      toTeam: dto.toTeam,
      kind: dto.kind ?? 'blocks',
      notes: dto.notes ?? '',
      customAttributes: {},
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateDependencyDto) {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { deleted: true };
  }
}

@Controller()
export class DependenciesController {
  constructor(private readonly dependencies: DependenciesService) {}

  @Get('dependencies')
  findAll(@Query() query: Record<string, string>) {
    return this.dependencies.findAll(query);
  }

  @Get('features/:featureId/dependencies')
  findByFeature(@Param('featureId') featureId: string) {
    return this.dependencies.findByFeature(featureId);
  }

  @Post('features/:featureId/dependencies')
  create(@Param('featureId') featureId: string, @Body() dto: CreateDependencyDto) {
    return this.dependencies.create(featureId, dto);
  }

  @Patch('dependencies/:id')
  update(@Param('id') id: string, @Body() dto: UpdateDependencyDto) {
    return this.dependencies.update(id, dto);
  }

  @Delete('dependencies/:id')
  remove(@Param('id') id: string) {
    return this.dependencies.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Dependency]), AttributesModule],
  controllers: [DependenciesController],
  providers: [DependenciesService],
  exports: [DependenciesService],
})
export class DependenciesModule {}
