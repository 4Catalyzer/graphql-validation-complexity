import { GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import * as IntrospectionTypes from 'graphql/type/introspection';

import CostCalculator from './CostCalculator';

export default class ComplexityVisitor {
  constructor(
    context,
    {
      scalarCost = 1,
      objectCost = 0,
      listFactor = 10,

      // Special list factor to make schema queries not have huge costs.
      introspectionListFactor = 2,
    },
  ) {
    this.context = context;

    this.scalarCost = scalarCost;
    this.objectCost = objectCost;
    this.listFactor = listFactor;
    this.introspectionListFactor = introspectionListFactor;

    this.currentFragment = null;
    this.costFactor = 1;

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
    this.costFactor *= this.getFieldCostFactor();
    this.getCalculator().addImmediate(this.costFactor * this.getFieldCost());
  }

  leaveField() {
    this.costFactor /= this.getFieldCostFactor();
  }

  getFieldCostFactor() {
    const fieldDef = this.context.getFieldDef();
    if (fieldDef?.extensions?.getCostFactor) {
      return fieldDef.extensions.getCostFactor();
    }

    const directiveCostFactor = this.getDirectiveValue('costFactor');
    if (directiveCostFactor != null) {
      return directiveCostFactor;
    }

    return this.getTypeCostFactor(this.context.getType());
  }

  getTypeCostFactor(type) {
    if (type instanceof GraphQLNonNull) {
      return this.getTypeCostFactor(type.ofType);
    }

    if (type instanceof GraphQLList) {
      const typeListFactor = this.isIntrospectionList(type)
        ? this.introspectionListFactor
        : this.listFactor;
      return typeListFactor * this.getTypeCostFactor(type.ofType);
    }

    return 1;
  }

  isIntrospectionList({ ofType }) {
    let type = ofType;
    if (type instanceof GraphQLNonNull) {
      type = type.ofType;
    }

    return IntrospectionTypes[type.name] === type;
  }

  getFieldCost() {
    const fieldDef = this.context.getFieldDef();
    if (fieldDef?.extensions?.getCost) {
      return fieldDef.extensions.getCost();
    }

    const directiveCost = this.getDirectiveValue('cost');
    if (directiveCost != null) {
      return directiveCost;
    }

    return this.getTypeCost(this.context.getType());
  }

  getTypeCost(type) {
    if (type instanceof GraphQLNonNull || type instanceof GraphQLList) {
      return this.getTypeCost(type.ofType);
    }

    return type instanceof GraphQLObjectType
      ? this.objectCost
      : this.scalarCost;
  }

  getDirectiveValue(directiveName) {
    const fieldDef = this.context.getFieldDef();
    if (!fieldDef?.astNode?.directives) {
      return null;
    }

    const directive = fieldDef.astNode.directives.find(
      ({ name }) => name.value === directiveName,
    );
    if (!directive) {
      return null;
    }

    const valueArgument = directive.arguments.find(
      (argument) => argument.name.value === 'value',
    );

    if (!valueArgument) {
      const fieldName = fieldDef.name;
      const parentTypeName = this.context.getParentType().name;

      throw new Error(
        `No \`value\` argument defined in \`@${directiveName}\` directive ` +
          `on \`${fieldName}\` field on \`${parentTypeName}\`.`,
      );
    }

    return parseFloat(valueArgument.value.value);
  }

  getCalculator() {
    return this.currentFragment === null
      ? this.rootCalculator
      : this.fragmentCalculators[this.currentFragment];
  }

  enterFragmentSpread(node) {
    this.getCalculator().addFragment(this.costFactor, node.name.value);
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
