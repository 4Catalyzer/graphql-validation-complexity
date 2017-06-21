import { parse, validate } from 'graphql';

import { createComplexityLimitRule } from '../src';

import schema from './fixtures/schema';

describe('createComplexityLimitRule', () => {
  it('should not report errors on a valid query', () => {
    const ast = parse(`
      query {
        item {
          name
        }
      }
    `);

    const errors = validate(schema, ast, [createComplexityLimitRule(9)]);
    expect(errors).toHaveLength(0);
  });

  it('should not report error on an invalid query', () => {
    const ast = parse(`
      query {
        list {
          name
        }
      }
    `);

    const errors = validate(schema, ast, [createComplexityLimitRule(9)]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      message: 'query exceeds complexity limit',
    });
  });

  it('should call onCost with complexity score', () => {
    const ast = parse(`
      query {
        list {
          name
        }
      }
    `);

    const onCost = jest.fn();
    const errors = validate(schema, ast, [
      createComplexityLimitRule(9, { onCost }),
    ]);
    expect(onCost).toBeCalledWith(10);
    expect(errors).toHaveLength(1);
  });
});
