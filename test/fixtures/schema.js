import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

const Item = new GraphQLObjectType({
  name: 'Item',
  fields: () => ({
    name: { type: GraphQLString },
    item: { type: Item },
    expensiveItem: {
      type: Item,
      getCost: () => 50,
    },
    list: { type: new GraphQLList(Item) },
    expensiveList: {
      type: new GraphQLList(Item),
      getCost: () => 10,
      getCostFactor: () => 20,
    },
    nonNullItem: {
      type: new GraphQLNonNull(Item),
      resolve: () => ({}),
    },
    nonNullList: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Item))),
      resolve: () => [],
    },
  }),
});

export default new GraphQLSchema({ query: Item });
