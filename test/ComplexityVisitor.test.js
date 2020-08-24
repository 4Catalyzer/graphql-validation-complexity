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

  describe('simple queries', () => {
    it('should calculate the correct cost', () => {
      const ast = parse(`
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

      const context = new ValidationContext(schema, ast, typeInfo);
      const visitor = new ComplexityVisitor(context, {});

      visit(ast, visitWithTypeInfo(typeInfo, visitor));
      expect(visitor.getCost()).toBe(123);
    });
  });

  describe('queries with fragments', () => {
    function checkCost(query) {
      const ast = parse(query);
      const context = new ValidationContext(schema, ast, typeInfo);
      const visitor = new ComplexityVisitor(context, {});

      visit(ast, visitWithTypeInfo(typeInfo, visitor));

      return visitor.getCost();
    }

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
              name
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

    it('should ignore undefined fragments', () => {
      const ast = parse(`
        query {
          item {
            name
            ...fragment1
          }
        }
      `);

      const context = new ValidationContext(schema, ast, typeInfo);
      const visitor = new ComplexityVisitor(context, {});

      visit(ast, visitWithTypeInfo(typeInfo, visitor));
      expect(visitor.getCost()).toBe(1);
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

      visit(ast, visitWithTypeInfo(typeInfo, visitor));
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

      visit(ast, visitWithTypeInfo(typeInfo, visitor));
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
        visit(ast, visitWithTypeInfo(sdlTypeInfo, visitor));
      }).toThrow(/`@cost` directive on `missingCostValue` field on `Query`/);
    });
  });

  describe('introspection query', () => {
    it('should calculate a reduced cost for the introspection query', () => {
      const ast = parse(getIntrospectionQuery());

      const context = new ValidationContext(schema, ast, typeInfo);
      const visitor = new ComplexityVisitor(context, {});

      visit(ast, visitWithTypeInfo(typeInfo, visitor));
      expect(visitor.getCost()).toBeLessThan(1000);
    });
  });
});
