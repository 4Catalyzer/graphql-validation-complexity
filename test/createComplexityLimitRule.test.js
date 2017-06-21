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
      message: 'query exceeds complexity limit. Cost: 10',
    });
  });

  it('should call formatErrorMessage with complexity score', () => {
    const ast = parse(`
      query {
        list {
          name
        }
      }
    `);

    const formatErrorMessage = jest.fn();
    const errors = validate(schema, ast, [
      createComplexityLimitRule(9, { formatErrorMessage }),
    ]);
    expect(formatErrorMessage).toBeCalledWith(10);
    expect(errors).toHaveLength(1);
  });
});
