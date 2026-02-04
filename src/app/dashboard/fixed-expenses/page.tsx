import { getFixedExpensesAction } from "@/features/fixed-expenses/actions/fixed-expense-actions";
import { FixedExpensesClient } from "./fixed-expenses-client";

export default async function FixedExpensesPage() {
  const result = await getFixedExpensesAction();
  const expenses = result.success ? result.data || [] : [];

  return <FixedExpensesClient initialExpenses={expenses} />;
}
