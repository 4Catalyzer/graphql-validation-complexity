import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

const Item = new GraphQLObjectType({
  name: 'Item',
  fields: () => ({
    name: {
      type: GraphQLString,
      args: {
        arg: { type: GraphQLInt },
      },
    },
    number: { type: GraphQLInt },
    item: { type: Item },
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
