/* eslint-disable no-use-before-define */
import {
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql';

const NamedItem = new GraphQLInterfaceType({
  name: 'NamedItem',
  fields: {
    name: {
      type: GraphQLString,
      args: {
        arg: { type: GraphQLInt },
      },
    },
  },
});

const PolyItem = new GraphQLUnionType({
  name: 'ItemUnion',
  types: () => [Item, Item2],
  resolveType: () => Item,
});

const Item2 = new GraphQLObjectType({
  name: 'Item2',
  interfaces: [NamedItem],
  fields: () => ({
    name: {
      type: GraphQLString,
      args: {
        arg: { type: GraphQLInt },
      },
    },
    number: { type: GraphQLInt },
    extra: { type: GraphQLInt },
    polyItem: { type: PolyItem },
  }),
});

const Item = new GraphQLObjectType({
  name: 'Item',

  interfaces: [NamedItem],
  fields: () => ({
    name: {
      type: GraphQLString,
      args: {
        arg: { type: GraphQLInt },
      },
    },
    number: { type: GraphQLInt },
    item: { type: Item },
    polyItem: { type: PolyItem },
    expensiveItem: {
      type: Item,
      extensions: {
        getCost: () => 50,
      },
    },
    list: { type: GraphQLList(Item) },
    expensiveList: {
      type: GraphQLList(Item),
      extensions: {
        getCost: () => 10,
        getCostFactor: () => 20,
      },
    },
    nonNullItem: {
      type: GraphQLNonNull(Item),
      resolve: () => ({}),
    },
    nonNullList: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(Item))),
      resolve: () => [],
    },
  }),
});

export default new GraphQLSchema({ query: Item });
