import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';
import { Repository } from 'typeorm';
import {
  ATTRIBUTE_ENTITY_TYPES,
  LINK_PROVIDERS,
  LINK_TYPES,
  entityTypeFromRoute,
  type AttributeEntityType,
} from '@feature-registry/shared';
import { ExternalLink } from '../entities/external-link.entity';
import { IntegrationsModule } from '../integrations/integrations.module';
import { IntegrationsService } from '../integrations/integrations.service';

export class CreateExternalLinkDto {
  @IsIn([...LINK_PROVIDERS])
  provider!: (typeof LINK_PROVIDERS)[number];

  @IsIn([...LINK_TYPES])
  type!: (typeof LINK_TYPES)[number];

  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  title?: string;
}

@Injectable()
export class ExternalLinksService {
  constructor(
    @InjectRepository(ExternalLink) private readonly repo: Repository<ExternalLink>,
    private readonly integrations: IntegrationsService,
  ) {}

  findFor(entityType: AttributeEntityType, entityId: string) {
    return this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(entityType: AttributeEntityType, entityId: string, dto: CreateExternalLinkDto) {
    const enriched = await this.integrations.enrich({
      provider: dto.provider,
      type: dto.type,
      url: dto.url,
      externalId: dto.externalId,
      title: dto.title,
    });
    const entity = this.repo.create({
      entityType,
      entityId,
      provider: enriched.provider,
      type: enriched.type,
      url: enriched.url,
      externalId: enriched.externalId ?? null,
      title: enriched.title ?? null,
      metadata: enriched.metadata ?? null,
    });
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) throw new NotFoundException('External link not found');
    await this.repo.remove(entity);
    return { deleted: true };
  }
}

@Controller()
export class ExternalLinksController {
  constructor(private readonly links: ExternalLinksService) {}

  @Get(':entityRoute/:entityId/links')
  findFor(@Param('entityRoute') entityRoute: string, @Param('entityId') entityId: string) {
    return this.links.findFor(this.parseType(entityRoute), entityId);
  }

  @Post(':entityRoute/:entityId/links')
  create(
    @Param('entityRoute') entityRoute: string,
    @Param('entityId') entityId: string,
    @Body() dto: CreateExternalLinkDto,
  ) {
    return this.links.create(this.parseType(entityRoute), entityId, dto);
  }

  @Delete('links/:id')
  remove(@Param('id') id: string) {
    return this.links.remove(id);
  }

  private parseType(route: string): AttributeEntityType {
    const type = entityTypeFromRoute(route);
    if (!type || !ATTRIBUTE_ENTITY_TYPES.includes(type)) {
      throw new BadRequestException(`Unknown entity route "${route}"`);
    }
    return type;
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([ExternalLink]), IntegrationsModule],
  controllers: [ExternalLinksController],
  providers: [ExternalLinksService],
  exports: [ExternalLinksService],
})
export class ExternalLinksModule {}
