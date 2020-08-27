import deepFreeze from 'deep-freeze';
import {
  TypeInfo,
  ValidationContext,
  getIntrospectionQuery,
  parse,
  visit,
  visitWithTypeInfo,
} from 'graphql';

import { ComplexityVisitor } from '../src';
import schema from './fixtures/schema';
import sdlSchema from './fixtures/sdlSchema';

describe('ComplexityVisitor', () => {
  const typeInfo = new TypeInfo(schema);
  const sdlTypeInfo = new TypeInfo(sdlSchema);

  function checkCost(query) {
    const ast = parse(query);
    const context = new ValidationContext(schema, ast, typeInfo);
    const visitor = new ComplexityVisitor(context, {});

    deepFreeze(ast); // ensure we aren't mutating accidentally

    visit(ast, visitWithTypeInfo(typeInfo, visitor));

    return visitor.getCost();
  }

  describe('simple queries', () => {
    it('should calculate the correct cost', () => {
      const cost = checkCost(`
        query {
          item {
            name
            item {
              name
            }
          }
          list {
            item {
              name
            }
            list {
              name
            }
          }
          nonNullItem {
            name
          }
          nonNullList {
            name
          }
        }
      `);

      expect(cost).toBe(123);
    });
  });

  describe('queries with fragments', () => {
    it('should calculate the correct cost', () => {
      const cost = checkCost(`
        fragment fragment1 on Item {
          name
          item {
            ...fragment2
          }
        }

        query {
          item {
            ...fragment1
            ... on Item {
              list {
                name
                ...fragment2
              }
            }
          }
          list {
            ...fragment2
          }
        }

        fragment fragment2 on Item {
          name
          ... on Item {
            item {
              name
            }
          }
        }
      `);

      expect(cost).toBe(43);
    });

    it('should deduplicate same fields', () => {
      const inlineCost = checkCost(`
        query {
          item {
            name
            item {
              name(arg: 4)
            }
          }
        }
      `);

      const fragmentCost = checkCost(`
        fragment fragment2 on Item {
          name
          other: name
          item {
            name
          }
        }

        fragment fragment1 on Item {
          name
          ...fragment2
        }

        query {
          item {
            ...fragment1
            name
          }
        }
      `);

      expect(fragmentCost).toBe(inlineCost);
    });

    it('should treat fields with args differently', () => {
      const fragmentCost = checkCost(`
        query {
          item {
            name
            name(arg: 4)
            name(arg: 5)
            name(arg: 4)
            name(other: 4)
          }
        }
      `);

      expect(fragmentCost).toBe(4);
    });

    it('should handle deduping selection sets', () => {
      const fragmentCost = checkCost(`
        query {
          item {
            name
          }
          item {
            name
            number
          }
        }
      `);

      expect(fragmentCost).toBe(2);
    });

    it('should merge inline fragments on the same type', () => {
      const fragmentCost = checkCost(`
        query {
          item {
            ... on Item {
              name
            }
            ...on Item {
              name
            }
          }
        }
      `);

      expect(fragmentCost).toBe(1);
    });

    it('should consider inline spreads of different types seperately', () => {
      const fragmentCost = checkCost(`
        query {
          item {
            ... on Item {
              name
            }
            ...on Item1 {
              name
            }
          }
        }
      `);

      expect(fragmentCost).toBe(2);
    });

    it('should ignore undefined fragments', () => {
      expect(
        checkCost(`
          query {
            item {
              name
              ...fragment1
            }
          }
        `),
      ).toBe(1);
    });
  });

  describe('custom visitor costs', () => {
    it('should calculate the correct cost', () => {
      const ast = parse(`
        query {
          item {
            item {
              name
            }
          }
          list {
            name
          }
        }
      `);

      const context = new ValidationContext(schema, ast, typeInfo);
      const visitor = new ComplexityVisitor(context, {
        objectCost: 10,
        listFactor: 3,
      });

      visit(deepFreeze(ast), visitWithTypeInfo(typeInfo, visitor));
      expect(visitor.getCost()).toBe(54);
    });
  });

  describe('custom field costs', () => {
    it('should calculate the correct cost', () => {
      const ast = parse(`
        query {
          expensiveItem {
            name
          }
          expensiveList {
            name
          }
        }
      `);

      const context = new ValidationContext(schema, ast, typeInfo);
      const visitor = new ComplexityVisitor(context, {});

      visit(deepFreeze(ast), visitWithTypeInfo(typeInfo, visitor));
      expect(visitor.getCost()).toBe(271);
    });

    it('should calculate the correct cost on an SDL schema', () => {
      const ast = parse(`
        query {
          expensiveItem {
            name
          }
          expensiveList {
            name
          }
        }
      `);

      const context = new ValidationContext(sdlSchema, ast, sdlTypeInfo);
      const visitor = new ComplexityVisitor(context, {});

      visit(ast, visitWithTypeInfo(sdlTypeInfo, visitor));
      expect(visitor.getCost()).toBe(271);
    });

    it('should error on missing value in cost directive', () => {
      const ast = parse(`
        query {
          missingCostValue
        }
      `);

      const context = new ValidationContext(sdlSchema, ast, sdlTypeInfo);
      const visitor = new ComplexityVisitor(context, {});

      expect(() => {
        visit(deepFreeze(ast), visitWithTypeInfo(sdlTypeInfo, visitor));
      }).toThrow(/`@cost` directive on `missingCostValue` field on `Query`/);
    });
  });

  describe('introspection query', () => {
    it('should calculate a reduced cost for the introspection query', () => {
      const ast = parse(getIntrospectionQuery());

      const context = new ValidationContext(schema, ast, typeInfo);
      const visitor = new ComplexityVisitor(context, {});

      visit(deepFreeze(ast), visitWithTypeInfo(typeInfo, visitor));
      expect(visitor.getCost()).toBeLessThan(1000);
    });
  });
});
