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

  it('should report error on an invalid query', () => {
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
        item {
          name
        }
      }
    `);

    const onCostSpy = jest.fn();

    const errors = validate(schema, ast, [
      createComplexityLimitRule(9, { onCost: onCostSpy }),
    ]);

    expect(errors).toHaveLength(0);
    expect(onCostSpy).toHaveBeenCalledWith(1);
  });

  it('should call onCost with cost when there are errors', () => {
    const ast = parse(`
      query {
        list {
          name
        }
      }
    `);

    const onCostSpy = jest.fn();

    const errors = validate(schema, ast, [
      createComplexityLimitRule(9, { onCost: onCostSpy }),
    ]);

    expect(errors).toHaveLength(1);
    expect(onCostSpy).toHaveBeenCalledWith(10);
  });

  it('should call formatError with error having cost', () => {
    const ast = parse(`
      query {
        list {
          name
        }
      }
    `);

    const formatErrorSpy = jest.fn();

    const errors = validate(schema, ast, [
      createComplexityLimitRule(9, { formatError: formatErrorSpy }),
    ]);

    expect(errors).toHaveLength(1);
    expect(formatErrorSpy).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.any(String),
      cost: expect.any(Number),
    }));
  });
});
