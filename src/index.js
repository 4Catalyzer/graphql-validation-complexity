import {
  getVisitFn, GraphQLError, GraphQLNonNull, GraphQLList, GraphQLObjectType,
} from 'graphql';
import * as IntrospectionTypes from 'graphql/type/introspection';

export class CostCalculator {
  constructor() {
    this.immediateCost = 0;
    this.fragmentCosts = [];

    this.cost = null;
  }

  addImmediate(cost) {
    this.immediateCost += cost;
  }

  addFragment(costFactor, name) {
    this.fragmentCosts.push([costFactor, name]);
  }

  calculateCost(fragmentCalculators) {
    if (this.cost !== null) {
      return this.cost;
    }

    let cost = this.immediateCost;
    this.fragmentCosts.forEach(([costFactor, name]) => {
      const fragmentCalculator = fragmentCalculators[name];
      if (!fragmentCalculator) {
        // Illegal query with undefined fragment.
        return;
      }

      cost += costFactor * fragmentCalculator.calculateCost(
        fragmentCalculators,
      );
    });

    this.cost = cost;
    return cost;
  }
}

export class ComplexityVisitor {
  constructor(context, {
    scalarCost = 1,
    objectCost = 0,
    listFactor = 10,

    // Special list factor to make schema queries not have huge costs.
    introspectionListFactor = 2,
  }) {
    this.context = context;

    this.scalarCost = scalarCost;
    this.objectCost = objectCost;
    this.listFactor = listFactor;
    this.introspectionListFactor = introspectionListFactor;

    this.currentFragment = null;
    this.listDepth = 0;
    this.introspectionListDepth = 0;

    this.rootCalculator = new CostCalculator();
    this.fragmentCalculators = Object.create(null);

    this.Field = {
      enter: this.enterField,
      leave: this.leaveField,
    };

    this.FragmentSpread = this.enterFragmentSpread;

    this.FragmentDefinition = {
      enter: this.enterFragmentDefinition,
      leave: this.leaveFragmentDefinition,
    };
  }

  enterField() {
    this.enterType(this.context.getType());
  }

  enterType(type) {
    if (type instanceof GraphQLNonNull) {
      this.enterType(type.ofType);
    } else if (type instanceof GraphQLList) {
      if (this.isIntrospectionList(type)) {
        ++this.introspectionListDepth;
      } else {
        ++this.listDepth;
      }

      this.enterType(type.ofType);
    } else {
      const fieldCost = type instanceof GraphQLObjectType ?
        this.objectCost : this.scalarCost;
      this.getCalculator().addImmediate(this.getDepthFactor() * fieldCost);
    }
  }

  isIntrospectionList({ ofType }) {
    let type = ofType;
    if (type instanceof GraphQLNonNull) {
      type = type.ofType;
    }

    return IntrospectionTypes[type.name] === type;
  }

  getCalculator() {
    return this.currentFragment === null ?
      this.rootCalculator : this.fragmentCalculators[this.currentFragment];
  }

  getDepthFactor() {
    return (
      this.listFactor ** this.listDepth *
      this.introspectionListFactor ** this.introspectionListDepth
    );
  }

  leaveField() {
    this.leaveType(this.context.getType());
  }

  leaveType(type) {
    if (type instanceof GraphQLNonNull) {
      this.leaveType(type.ofType);
    } else if (type instanceof GraphQLList) {
      if (this.isIntrospectionList(type)) {
        --this.introspectionListDepth;
      } else {
        --this.listDepth;
      }

      this.leaveType(type.ofType);
    }
  }

  enterFragmentSpread(node) {
    this.getCalculator().addFragment(this.getDepthFactor(), node.name.value);
  }

  enterFragmentDefinition(node) {
    const fragmentName = node.name.value;
    this.fragmentCalculators[fragmentName] = new CostCalculator();
    this.currentFragment = fragmentName;
  }

  leaveFragmentDefinition() {
    this.currentFragment = null;
  }

  getCost() {
    return this.rootCalculator.calculateCost(this.fragmentCalculators);
  }
}

export function createComplexityLimitRule(
  maxCost,
  {
    onCost,
    formatError,
    ...options
  } = {},
) {
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
            onCost(cost);
          }

          if (cost > maxCost) {
            const error = new GraphQLError(
              'query exceeds complexity limit', [node],
            );
            error.cost = cost;
            context.reportError(
              formatError ? formatError(error) : error,
            );
          }
        }
      },
    };
  };
}
