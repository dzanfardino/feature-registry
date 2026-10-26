import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeDefinition } from '../entities/attribute-definition.entity';
import { Feature } from '../entities/feature.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { Dependency } from '../entities/dependency.entity';
import { ReleaseChecklistItem } from '../entities/release-checklist-item.entity';
import { AttributesController } from './attributes.controller';
import { AttributesPersistence } from './attributes.persistence';
import { AttributesService } from './attributes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttributeDefinition,
      Feature,
      FeatureFlag,
      Dependency,
      ReleaseChecklistItem,
    ]),
  ],
  controllers: [AttributesController],
  providers: [AttributesService, AttributesPersistence],
  exports: [AttributesService, AttributesPersistence],
})
export class AttributesModule {}
