import { buildSchema } from 'graphql';

export default buildSchema(`
  type Query {
    name: String

    item: Query
    expensiveItem: Query @cost(value: 50)
    list: [Query]
    expensiveList: [Query] @cost(value: 10) @costFactor(value: 20)

    missingCostValue: String @cost
  }
`);
