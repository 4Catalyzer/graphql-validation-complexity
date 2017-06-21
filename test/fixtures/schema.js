import {
  GraphQLList, GraphQLObjectType, GraphQLNonNull, GraphQLSchema, GraphQLString,
} from 'graphql';

const Item = new GraphQLObjectType({
  name: 'Item',
  fields: () => ({
    name: { type: GraphQLString },
    item: { type: Item },
    list: { type: new GraphQLList(Item) },
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
