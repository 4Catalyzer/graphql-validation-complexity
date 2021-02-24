import type { ASTNode, GraphQLError, ValidationContext } from 'graphql';

export interface ComplexityLimitRuleOptions {
  onCost?: (cost: number, context: ValidationContext) => void;
  createError?: (cost: number, node: ASTNode) => GraphQLError;
  formatErrorMessage?: (cost: number) => string;

  scalarCost?: number;
  objectCost?: number;
  listFactor?: number;
  introspectionListFactor?: number;
}

export function createComplexityLimitRule(
  maxCost: number,
  options?: ComplexityLimitRuleOptions,
): (ctx: ValidationContext) => any;
