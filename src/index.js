import { getVisitFn, GraphQLError } from 'graphql';
import warning from 'warning';

import ComplexityVisitor from './ComplexityVisitor';
import CostCalculator from './CostCalculator';

export { ComplexityVisitor, CostCalculator };

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

    return {
      enter(node) {
        const visit = getVisitFn(visitor, node.kind, false);
        if (visit) {
          visit.apply(visitor, arguments); // eslint-disable-line prefer-rest-params
        }
      },

      leave(node) {
        const visit = getVisitFn(visitor, node.kind, true);
        if (visit) {
          visit.apply(visitor, arguments); // eslint-disable-line prefer-rest-params
        }

        if (node.kind === 'Document') {
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
        }
      },
    };
  };
}
