"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/lib/userContext";
import { createClient } from "@/lib/supabase/client";
import NamePrompt from "@/components/NamePrompt";
import AddExpenseForm from "@/components/AddExpenseForm";
import InviteMember from "@/components/InviteMember";
import BalanceSummary from "@/components/BalanceSummary";
import Link from "next/link";

type Member = { id: string; name: string };
type Split = { member_id: string; amount: number };
type Expense = { id: string; description: string; amount: number; paid_by: string; created_at: string; expense_splits: Split[] };

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const { member, loading } = useUser();
  const supabase = createClient();
  const [group, setGroup] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (member) load();
  }, [member]);

  async function load() {
    const [{ data: g }, { data: gm }, { data: exp }] = await Promise.all([
      supabase.from("groups").select("id, name").eq("id", id).single(),
      supabase.from("group_members").select("member_id, members(id, name)").eq("group_id", id),
      supabase.from("expenses").select("id, description, amount, paid_by, created_at, expense_splits(member_id, amount)").eq("group_id", id).order("created_at", { ascending: false }),
    ]);
    setGroup(g);
    const memberList = (gm ?? []).map((m: any) => m.members).filter(Boolean);
    setMembers(memberList);
    setExpenses(exp ?? []);
    setIsMember(memberList.some((m: Member) => m.id === member?.id));
  }

  async function joinGroup() {
    if (!member) return;
    await supabase.from("group_members").insert({ group_id: id, member_id: member.id });
    load();
  }

  if (loading) return null;
  if (!member) return <NamePrompt />;
  if (!group) return <p className="p-6 text-gray-400">Group not found.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <h1 className="text-2xl font-bold">{group.name}</h1>
      </div>

      {!isMember && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-yellow-800">You're not in this group yet.</p>
          <button onClick={joinGroup} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
            Join
          </button>
        </div>
      )}

      <BalanceSummary expenses={expenses} members={members} currentMemberId={member.id} />

      {isMember && (
        <>
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Add Expense</h2>
            <AddExpenseForm groupId={id} members={members} currentMemberId={member.id} onAdded={load} />
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Add Member</h2>
            <InviteMember groupId={id} existingMembers={members} onAdded={load} />
          </div>
        </>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Expenses</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-400 text-sm">No expenses yet.</p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((exp) => {
              const payer = members.find((m) => m.id === exp.paid_by);
              return (
                <li key={exp.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{exp.description}</p>
                      <p className="text-sm text-gray-500">Paid by {payer?.name ?? "someone"}</p>
                    </div>
                    <span className="font-semibold text-green-600">${Number(exp.amount).toFixed(2)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
