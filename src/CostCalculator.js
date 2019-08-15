export default class CostCalculator {
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

      cost +=
        costFactor * fragmentCalculator.calculateCost(fragmentCalculators);
    });

    this.cost = cost;
    return cost;
  }
}
