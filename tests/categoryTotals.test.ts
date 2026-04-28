// tests/categoryTotals.test.ts
import { getCategoryTotals } from "../app/utils/categoryTotals";

describe("getCategoryTotals", () => {
  //  Basic functionality 

  it("returns an empty object for an empty array", () => {
    expect(getCategoryTotals([])).toEqual({});
  });

  it("sums amounts for a single category", () => {
    const expenses = [
      { category: "Food", amount: 10 },
      { category: "Food", amount: 25 },
    ];
    expect(getCategoryTotals(expenses)).toEqual({ Food: 35 });
  });

  it("tracks multiple categories independently", () => {
    const expenses = [
      { category: "Food", amount: 50 },
      { category: "Transport", amount: 20 },
      { category: "Food", amount: 30 },
    ];
    const result = getCategoryTotals(expenses);
    expect(result.Food).toBe(80);
    expect(result.Transport).toBe(20);
  });

  // Edge cases

  it('falls back to "Other" when category is missing', () => {
    const expenses = [{ amount: 15 }, { amount: 5 }];
    expect(getCategoryTotals(expenses)).toEqual({ Other: 20 });
  });

  it('falls back to "Other" when category is null', () => {
    const expenses = [{ category: null, amount: 40 }];
    expect(getCategoryTotals(expenses)).toEqual({ Other: 40 });
  });

  it("treats 0 as a valid amount and does not skip it", () => {
    const expenses = [{ category: "Food", amount: 0 }];
    expect(getCategoryTotals(expenses)).toEqual({ Food: 0 });
  });

  it("handles missing amount gracefully (treats as 0)", () => {
    const expenses = [{ category: "Food" }];
    expect(getCategoryTotals(expenses)).toEqual({ Food: 0 });
  });

  it("handles decimal amounts correctly", () => {
    const expenses = [
      { category: "Food", amount: 9.99 },
      { category: "Food", amount: 0.01 },
    ];
    expect(getCategoryTotals(expenses).Food).toBeCloseTo(10.0);
  });

  it("handles a large number of diverse expenses", () => {
    const categories = ["Food", "Transport", "Shopping", "Health", "Entertainment"];
    const expenses = Array.from({ length: 100 }, (_, i) => ({
      category: categories[i % categories.length],
      amount: 1,
    }));
    const result = getCategoryTotals(expenses);
    categories.forEach((cat) => expect(result[cat]).toBe(20));
  });

  it("is case-sensitive with category names", () => {
    const expenses = [
      { category: "food", amount: 10 },
      { category: "Food", amount: 20 },
    ];
    const result = getCategoryTotals(expenses);
    expect(result["food"]).toBe(10);
    expect(result["Food"]).toBe(20);
  });
});
