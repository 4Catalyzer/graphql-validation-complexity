# graphql-validation-complexity [![Travis][build-badge]][build] [![npm][npm-badge]][npm]

Query complexity validation for GraphQL.js.

[![Codecov][codecov-badge]][codecov]

## Usage

```js
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const ComplexityLimitRule = createComplexityLimitRule(1000);
// Then use this rule with validate().
```

You can also provide custom costs for scalars and objects, and a custom cost factor for lists. You can provide `onCost` function to always log the query cost. eg: in dev mode. Pass `formatErrorMessage` for custom error message when query cost exceeds max cost. Defaults to `query exceeds complexity limit`.

```js
const ComplexityLimitRule = createComplexityLimitRule(1000, {
  scalarCost: 1,
  objectCost: 10, // Default is 0.
  listFactor: 20, // Default is 10.
  onCost: cost => console.log('total'),
  formatErrorMessage: cost => 'Bad Query',
});
```

[build-badge]: https://img.shields.io/travis/4Catalyzer/graphql-validation-complexity/master.svg
[build]: https://travis-ci.org/4Catalyzer/graphql-validation-complexity

[npm-badge]: https://img.shields.io/npm/v/graphql-validation-complexity.svg
[npm]: https://www.npmjs.org/package/graphql-validation-complexity

[codecov-badge]: https://img.shields.io/codecov/c/github/4Catalyzer/graphql-validation-complexity/master.svg
[codecov]: https://codecov.io/gh/4Catalyzer/graphql-validation-complexity
