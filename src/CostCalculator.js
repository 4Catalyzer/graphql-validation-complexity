export default class CostCalculator {
  constructor() {
    this.immediateCost = 0;

    this.cost = null;
  }

  addImmediate(cost) {
    this.immediateCost += cost;
  }

  calculateCost() {
    if (this.cost !== null) {
      return this.cost;
    }

    return this.immediateCost;
  }
}
