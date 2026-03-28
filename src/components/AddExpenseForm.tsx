"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = { id: string; name: string };

export default function AddExpenseForm({
  groupId,
  members,
  currentMemberId,
  onAdded,
}: {
  groupId: string;
  members: Member[];
  currentMemberId: string;
  onAdded: () => void;
}) {
  const supabase = createClient();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentMemberId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0) {
      setError("Enter a valid amount.");
      setLoading(false);
      return;
    }

    const splitAmount = parseFloat((total / members.length).toFixed(2));

    const { data: expense, error: expErr } = await supabase
      .from("expenses")
      .insert({ group_id: groupId, description, amount: total, paid_by: paidBy })
      .select()
      .single();

    if (expErr || !expense) {
      setError(expErr?.message ?? "Failed to add expense");
      setLoading(false);
      return;
    }

    await supabase.from("expense_splits").insert(
      members.map((m) => ({ expense_id: expense.id, member_id: m.id, amount: splitAmount }))
    );

    setDescription("");
    setAmount("");
    setLoading(false);
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (e.g. Dinner)"
        required
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount ($)"
          min="0.01"
          step="0.01"
          required
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-gray-400">Split equally among {members.length} member{members.length !== 1 ? "s" : ""}</p>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Expense"}
      </button>
    </form>
  );
}
