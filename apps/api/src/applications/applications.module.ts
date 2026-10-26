import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional, IsString } from 'class-validator';
import { Body, Controller, Delete, Get, Injectable, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../entities/application.entity';

export class CreateApplicationDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application) private readonly repo: Repository<Application>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id }, relations: ['features'] });
    if (!entity) throw new NotFoundException('Application not found');
    return entity;
  }

  create(dto: CreateApplicationDto) {
    const entity = this.repo.create({
      name: dto.name,
      description: dto.description ?? '',
      slug: dto.slug || slugify(dto.name),
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateApplicationDto) {
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

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  findAll() {
    return this.applications.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applications.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.applications.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applications.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applications.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Application])],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
