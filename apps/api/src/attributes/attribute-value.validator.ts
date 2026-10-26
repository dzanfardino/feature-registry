import { BadRequestException } from '@nestjs/common';
import type { AttributeDataType, CustomAttributeValues } from '@feature-registry/shared';
import { AttributeDefinition } from '../entities/attribute-definition.entity';

export class AttributeValueValidator {
  validate(
    definitions: AttributeDefinition[],
    values: CustomAttributeValues,
    options: { requireAll?: boolean } = {},
  ): CustomAttributeValues {
    const active = definitions.filter((definition) => definition.status === 'active');
    const next: CustomAttributeValues = { ...values };

    for (const definition of active) {
      const hasValue = Object.prototype.hasOwnProperty.call(next, definition.key);
      const raw = hasValue ? next[definition.key] : undefined;
      const empty = raw === undefined || raw === null || raw === '';

      if (empty && definition.required && options.requireAll !== false) {
        throw new BadRequestException(`Attribute "${definition.key}" is required`);
      }

      if (empty) {
        if (definition.defaultValue !== undefined && definition.defaultValue !== null && !hasValue) {
          next[definition.key] = definition.defaultValue;
        }
        continue;
      }

      next[definition.key] = this.coerceAndCheck(definition, raw);
    }

    return next;
  }

  private coerceAndCheck(definition: AttributeDefinition, raw: unknown): unknown {
    const { dataType, key, options, validation } = definition;

    switch (dataType) {
      case 'number': {
        const num = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isNaN(num)) {
          throw new BadRequestException(`Attribute "${key}" must be a number`);
        }
        this.checkRange(key, num, validation?.min, validation?.max);
        return num;
      }
      case 'boolean': {
        if (typeof raw === 'boolean') return raw;
        if (raw === 'true' || raw === 'false') return raw === 'true';
        throw new BadRequestException(`Attribute "${key}" must be a boolean`);
      }
      case 'date': {
        const date = raw instanceof Date ? raw : new Date(String(raw));
        if (Number.isNaN(date.getTime())) {
          throw new BadRequestException(`Attribute "${key}" must be a date`);
        }
        return date.toISOString();
      }
      case 'enum': {
        const value = String(raw);
        if (options && options.length > 0 && !options.includes(value)) {
          throw new BadRequestException(`Attribute "${key}" must be one of: ${options.join(', ')}`);
        }
        return value;
      }
      case 'url': {
        const value = String(raw);
        try {
          new URL(value);
        } catch {
          throw new BadRequestException(`Attribute "${key}" must be a valid URL`);
        }
        return value;
      }
      case 'string':
      case 'text':
      case 'user': {
        const value = String(raw);
        this.checkRange(key, value.length, validation?.min, validation?.max);
        if (validation?.regex) {
          const pattern = new RegExp(validation.regex);
          if (!pattern.test(value)) {
            throw new BadRequestException(`Attribute "${key}" does not match required pattern`);
          }
        }
        return value;
      }
      default:
        return raw;
    }
  }

  private checkRange(
    key: string,
    value: number,
    min?: number | null,
    max?: number | null,
  ): void {
    if (min != null && value < min) {
      throw new BadRequestException(`Attribute "${key}" is below the minimum of ${min}`);
    }
    if (max != null && value > max) {
      throw new BadRequestException(`Attribute "${key}" exceeds the maximum of ${max}`);
    }
  }

  assertDataType(_dataType: AttributeDataType): void {
    // kept for callers that want an explicit type check hook
  }
}
