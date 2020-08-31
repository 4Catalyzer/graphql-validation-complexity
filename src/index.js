import { GraphQLError, TypeInfo, visit, visitWithTypeInfo } from 'graphql';
import warning from 'warning';

import ComplexityVisitor from './ComplexityVisitor';

export { ComplexityVisitor };

export function complexityLimitExceededErrorMessage() {
  // By default, don't respond with the cost to avoid leaking information about
  // the cost scheme to a potentially malicious client.
  return 'query exceeds complexity limit';
}

export function createComplexityLimitRule(
  maxCost,
  { onCost, createError, formatErrorMessage, ...options } = {},
) {
  warning(
    !(createError && formatErrorMessage),
    'formatErrorMessage is ignored when createError is specified.',
  );

  formatErrorMessage = // eslint-disable-line no-param-reassign
    formatErrorMessage || complexityLimitExceededErrorMessage;

  return function ComplexityLimit(context) {
    const visitor = new ComplexityVisitor(context, options);
    // eslint-disable-next-line no-underscore-dangle
    const typeInfo = context._typeInfo || new TypeInfo(context.getSchema());

    return {
      Document: {
        enter(node) {
          visit(node, visitWithTypeInfo(typeInfo, visitor));
        },
        leave(node) {
          const cost = visitor.getCost();

          if (onCost) {
            onCost(cost, context);
          }

          if (cost > maxCost) {
            context.reportError(
              createError
                ? createError(cost, node)
                : new GraphQLError(formatErrorMessage(cost), [node]),
            );
          }
        },
      },
    };
  };
}
