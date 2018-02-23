# graphql-validation-complexity [![Travis][build-badge]][build] [![npm][npm-badge]][npm]

Query complexity validation for GraphQL.js.

[![Codecov][codecov-badge]][codecov]

## Usage

```js
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const ComplexityLimitRule = createComplexityLimitRule(1000);
// Then use this rule with validate() or other validation APIs.
```

For example, with `express-graphql`, pass the complexity limit rule to `validationRules`.

```js
const graphqlMiddleware = graphqlHTTP({
  schema,
  validationRules: [
    createComplexityLimitRule(1000),
  ],
});
```

You can provide a configuration object with custom global costs for scalars and objects as `scalarCost` and `objectCost` respectively, and a custom cost factor for lists as `listFactor`.

```js
const ComplexityLimitRule = createComplexityLimitRule(1000, {
  scalarCost: 1,
  objectCost: 10, // Default is 0.
  listFactor: 20, // Default is 10.
});
```

You can also set custom costs and cost factors on fields definitions with `getCost` and `getCostFactor` callbacks.

```js
const expensiveField = {
  type: ExpensiveItem,
  getCost: () => 50,
};

const expensiveList = {
  type: new GraphQLList(MyItem),
  getCostFactor: () => 100,
};
```

You can also define these via field directives in the SDL.

```graphql
type CustomCostItem {
  expensiveField: ExpensiveItem @cost(value: 50)
  expensiveList: [MyItem] @costFactor(value: 100)
}
```

The configuration object also supports an `onCost` callback for logging query costs and a `formatErrorMessage` callback for customizing error messages. `onCost` will be called for every query with its cost. `formatErrorMessage` will be called with the cost whenever a query exceeds the complexity limit, and should return a string containing the error message.

```js
const ComplexityLimitRule = createComplexityLimitRule(1000, {
  onCost: (cost) => {
    console.log('query cost:', cost);
  },
  formatErrorMessage: cost => (
    `query with cost ${cost} exceeds complexity limit`
  ),
});
```

The configuration object also supports a `createError` callback for creating a custom `GraphQLError`. `createError` will be called with the cost and the document node whenever an error occurs. `formatErrorMessage` will be ignored when `createError` is specified.

```js
const ComplexityLimitRule = createComplexityLimitRule(1000, {
  createError(cost, documentNode) {
    const error = new GraphQLError('custom error', [documentNode]);
    error.meta = { cost };
    return error;
  },
});
```

By default, the validation rule applies a custom, lower cost factor for lists of introspection types, to prevent introspection queries from having unreasonably high costs. You can adjust this by setting `introspectionListFactor` on the configuration object.

```js
const ComplexityLimitRule = createComplexityLimitRule(1000, {
  introspectionListFactor: 10, // Default is 2.
});
```

[build-badge]: https://img.shields.io/travis/4Catalyzer/graphql-validation-complexity/master.svg
[build]: https://travis-ci.org/4Catalyzer/graphql-validation-complexity

[npm-badge]: https://img.shields.io/npm/v/graphql-validation-complexity.svg
[npm]: https://www.npmjs.org/package/graphql-validation-complexity

[codecov-badge]: https://img.shields.io/codecov/c/github/4Catalyzer/graphql-validation-complexity/master.svg
[codecov]: https://codecov.io/gh/4Catalyzer/graphql-validation-complexity
