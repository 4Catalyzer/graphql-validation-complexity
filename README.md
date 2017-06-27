# graphql-validation-complexity [![Travis][build-badge]][build] [![npm][npm-badge]][npm]

Query complexity validation for GraphQL.js.

[![Codecov][codecov-badge]][codecov]

## Usage

```js
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const ComplexityLimitRule = createComplexityLimitRule(1000);
// Then use this rule with validate().
```

You can provide a configuration object with custom costs for scalars and objects as `scalarCost` and `objectCost` respectively, and a custom cost factor for lists as `listFactor`.

```js
const ComplexityLimitRule = createComplexityLimitRule(1000, {
  scalarCost: 1,
  objectCost: 10, // Default is 0.
  listFactor: 20, // Default is 10.
});
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

[build-badge]: https://img.shields.io/travis/4Catalyzer/graphql-validation-complexity/master.svg
[build]: https://travis-ci.org/4Catalyzer/graphql-validation-complexity

[npm-badge]: https://img.shields.io/npm/v/graphql-validation-complexity.svg
[npm]: https://www.npmjs.org/package/graphql-validation-complexity

[codecov-badge]: https://img.shields.io/codecov/c/github/4Catalyzer/graphql-validation-complexity/master.svg
[codecov]: https://codecov.io/gh/4Catalyzer/graphql-validation-complexity
