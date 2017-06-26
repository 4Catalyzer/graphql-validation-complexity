import { parse, validate, introspectionQuery } from 'graphql';

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
    expect(errors[0]).toMatchObject({
      message: 'custom error, cost 10',
    });

  });

  it('should not fail on introspection queries', () => {
    const ast = parse(introspectionQuery);
    const errors = validate(schema, ast, [
      createComplexityLimitRule(9),
    ]);
    expect(errors).toHaveLength(0);
  });

  it('should not include private fields in cost calculation', () => {
    const ast = parse(`
      query {
        __typename
        item {
          name
          __typename
        }
      }
    `);

    const errors = validate(schema, ast, [
      createComplexityLimitRule(1),
    ]);
    expect(errors).toHaveLength(0);
  });
});
