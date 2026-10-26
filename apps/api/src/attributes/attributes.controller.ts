import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import type { AttributeEntityType } from '@feature-registry/shared';
import { entityTypeFromRoute } from '@feature-registry/shared';
import { AttributesService } from './attributes.service';
import {
  CreateAttributeDefinitionDto,
  SetAttributeValuesDto,
  UpdateAttributeDefinitionDto,
} from './dto';

@Controller()
export class AttributesController {
  constructor(private readonly attributes: AttributesService) {}

  @Get('attribute-definitions')
  list(
    @Query('appliesTo') appliesTo?: AttributeEntityType,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.attributes.listDefinitions(appliesTo, includeArchived === 'true');
  }

  @Post('attribute-definitions')
  create(@Body() dto: CreateAttributeDefinitionDto) {
    return this.attributes.createDefinition(dto);
  }

  @Patch('attribute-definitions/:id')
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDefinitionDto) {
    return this.attributes.updateDefinition(id, dto);
  }

  @Post('attribute-definitions/:id/archive')
  archive(@Param('id') id: string) {
    return this.attributes.archiveDefinition(id);
  }

  @Get(':entityRoute/:entityId/attributes')
  getValues(@Param('entityRoute') entityRoute: string, @Param('entityId') entityId: string) {
    return this.attributes.getValues(this.parseType(entityRoute), entityId);
  }

  @Put(':entityRoute/:entityId/attributes')
  setValues(
    @Param('entityRoute') entityRoute: string,
    @Param('entityId') entityId: string,
    @Body() dto: SetAttributeValuesDto,
  ) {
    return this.attributes.setValues(this.parseType(entityRoute), entityId, dto.values);
  }

  private parseType(route: string): AttributeEntityType {
    const type = entityTypeFromRoute(route);
    if (!type) throw new BadRequestException(`Unknown entity route "${route}"`);
    return type;
  }
}
