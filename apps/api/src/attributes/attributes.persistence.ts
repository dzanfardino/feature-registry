import { Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import type { CustomAttributeValues } from '@feature-registry/shared';

export interface HasCustomAttributes {
  customAttributes: CustomAttributeValues;
}

@Injectable()
export class AttributesPersistence {
  read(entity: HasCustomAttributes): CustomAttributeValues {
    return entity.customAttributes ?? {};
  }

  write(entity: HasCustomAttributes, values: CustomAttributeValues): void {
    entity.customAttributes = values;
  }

  applyFilters<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    filters: Record<string, string>,
  ): SelectQueryBuilder<T> {
    Object.entries(filters).forEach(([key, value], index) => {
      const keyParam = `attrKey${index}`;
      const valueParam = `attrValue${index}`;
      qb.andWhere(`${alias}.customAttributes ->> :${keyParam} = :${valueParam}`, {
        [keyParam]: key,
        [valueParam]: value,
      });
    });
    return qb;
  }

  extractQueryFilters(query: Record<string, string | undefined>): Record<string, string> {
    const filters: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('attr.') && value !== undefined && value !== '') {
        filters[key.slice(5)] = value;
      }
    }
    return filters;
  }
}
