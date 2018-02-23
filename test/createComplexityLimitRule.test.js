import { GraphQLError, parse, validate } from 'graphql';

import { createComplexityLimitRule } from '../src';

import schema from './fixtures/schema';
import sdlSchema from './fixtures/sdlSchema';

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
    expect({ ...errors[0] }).toMatchObject({
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

  it('should call onCost with complexity score on an SDL schema', () => {
    const ast = parse(`
      query {
        expensiveItem {
          name
        }
      }
    `);

    const onCostSpy = jest.fn();

    const errors = validate(sdlSchema, ast, [
      createComplexityLimitRule(60, { onCost: onCostSpy }),
    ]);

    expect(errors).toHaveLength(0);
    expect(onCostSpy).toHaveBeenCalledWith(51);
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

  it('should call formatErrorMessage with cost', () => {
    const ast = parse(`
      query {
        list {
          name
        }
      }
    `);

    const errors = validate(schema, ast, [
      createComplexityLimitRule(9, {
        formatErrorMessage: cost => `custom error, cost ${cost}`,
      }),
    ]);

    expect(errors).toHaveLength(1);
    expect({ ...errors[0] }).toMatchObject({
      message: 'custom error, cost 10',
    });
  });

  it('should use createError to create the error', () => {
    const ast = parse(`
      query {
        list {
          name
        }
      }
    `);

    const errors = validate(schema, ast, [
      createComplexityLimitRule(9, {
        createError(cost, documentNode) {
          const error = new GraphQLError('custom error', [documentNode]);
          error.meta = { cost };
          return error;
        },
      }),
    ]);

    expect(errors).toHaveLength(1);
    expect({ ...errors[0] }).toMatchObject({
      message: 'custom error',
      meta: { cost: 10 },
    });
  });
});
