import { Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  ATTRIBUTE_DATA_TYPES,
  ATTRIBUTE_ENTITY_TYPES,
  ATTRIBUTE_STATUSES,
} from '@feature-registry/shared';

class ValidationRulesDto {
  @IsOptional()
  min?: number | null;

  @IsOptional()
  max?: number | null;

  @IsOptional()
  @IsString()
  regex?: string | null;
}

export class CreateAttributeDefinitionDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn([...ATTRIBUTE_DATA_TYPES])
  dataType!: (typeof ATTRIBUTE_DATA_TYPES)[number];

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @Allow()
  defaultValue?: unknown;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsIn([...ATTRIBUTE_ENTITY_TYPES])
  appliesTo!: (typeof ATTRIBUTE_ENTITY_TYPES)[number];

  @IsOptional()
  @ValidateNested()
  @Type(() => ValidationRulesDto)
  validation?: ValidationRulesDto;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateAttributeDefinitionDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn([...ATTRIBUTE_DATA_TYPES])
  dataType?: (typeof ATTRIBUTE_DATA_TYPES)[number];

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @Allow()
  defaultValue?: unknown;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ValidationRulesDto)
  validation?: ValidationRulesDto;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsIn([...ATTRIBUTE_STATUSES])
  status?: (typeof ATTRIBUTE_STATUSES)[number];
}

export class SetAttributeValuesDto {
  @IsObject()
  values!: Record<string, unknown>;
}
