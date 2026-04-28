// utils/categoryTotals.ts
export function getCategoryTotals(expenses: any[]) {
  const totals: Record<string, number> = {};

  expenses.forEach(e => {
    const cat = e.category || "Other";
    totals[cat] = (totals[cat] || 0) + (e.amount || 0);
  });

  return totals;
}