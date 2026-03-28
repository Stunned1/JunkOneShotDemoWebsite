"use client";

type Member = { id: string; name: string };
type Split = { member_id: string; amount: number };
type Expense = { paid_by: string; amount: number; expense_splits: Split[] };

export default function BalanceSummary({
  expenses,
  members,
  currentMemberId,
}: {
  expenses: Expense[];
  members: Member[];
  currentMemberId: string;
}) {
  const balances: Record<string, number> = {};
  members.forEach((m) => (balances[m.id] = 0));

  for (const exp of expenses) {
    balances[exp.paid_by] = (balances[exp.paid_by] ?? 0) + Number(exp.amount);
    for (const split of exp.expense_splits) {
      balances[split.member_id] = (balances[split.member_id] ?? 0) - Number(split.amount);
    }
  }

  const getName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";
  const myBalance = balances[currentMemberId] ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-3">Balances</h2>
      {members.length === 0 ? (
        <p className="text-gray-400 text-sm">No members yet.</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const bal = balances[m.id] ?? 0;
            return (
              <div key={m.id} className="flex justify-between items-center text-sm">
                <span className={m.id === currentMemberId ? "font-semibold" : ""}>
                  {getName(m.id)}{m.id === currentMemberId ? " (you)" : ""}
                </span>
                <span className={bal > 0 ? "text-green-600 font-medium" : bal < 0 ? "text-red-500 font-medium" : "text-gray-400"}>
                  {bal > 0 ? `+$${bal.toFixed(2)}` : bal < 0 ? `-$${Math.abs(bal).toFixed(2)}` : "settled"}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {myBalance !== 0 && (
        <p className="mt-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
          {myBalance > 0
            ? `You are owed $${myBalance.toFixed(2)} overall`
            : `You owe $${Math.abs(myBalance).toFixed(2)} overall`}
        </p>
      )}
    </div>
  );
}
