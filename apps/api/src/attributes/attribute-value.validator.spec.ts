import { BadRequestException } from '@nestjs/common';
import { AttributeDefinition } from '../entities/attribute-definition.entity';
import { AttributeValueValidator } from './attribute-value.validator';

function definition(partial: Partial<AttributeDefinition>): AttributeDefinition {
  return {
    id: '1',
    key: 'region',
    label: 'Region',
    description: null,
    dataType: 'string',
    required: false,
    defaultValue: null,
    options: null,
    appliesTo: 'Feature',
    validation: {},
    sortOrder: 0,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe('AttributeValueValidator', () => {
  const validator = new AttributeValueValidator();

  it('rejects missing required attributes', () => {
    expect(() =>
      validator.validate([definition({ required: true })], {}),
    ).toThrow(BadRequestException);
  });

  it('applies default values when omitted', () => {
    const result = validator.validate(
      [definition({ defaultValue: 'eu', required: false })],
      {},
    );
    expect(result.region).toBe('eu');
  });

  it('validates enum options', () => {
    expect(() =>
      validator.validate(
        [definition({ dataType: 'enum', options: ['eu', 'us'] })],
        { region: 'apac' },
      ),
    ).toThrow(BadRequestException);
  });

  it('validates numbers and range', () => {
    const result = validator.validate(
      [definition({ key: 'score', dataType: 'number', validation: { min: 1, max: 5 } })],
      { score: '3' },
    );
    expect(result.score).toBe(3);
  });

  it('validates urls', () => {
    expect(() =>
      validator.validate([definition({ dataType: 'url' })], { region: 'not-a-url' }),
    ).toThrow(BadRequestException);
  });
});
