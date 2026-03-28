"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/userContext";
import { createClient } from "@/lib/supabase/client";
import NamePrompt from "@/components/NamePrompt";
import Link from "next/link";

type Group = { id: string; name: string; created_at: string };

export default function DashboardPage() {
  const { member, loading } = useUser();
  const supabase = createClient();
  const [groups, setGroups] = useState<Group[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (member) fetchGroups();
  }, [member]);

  async function fetchGroups() {
    const { data } = await supabase
      .from("groups")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });
    setGroups(data ?? []);
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !member) return;
    setCreating(true);
    const { data: group } = await supabase
      .from("groups")
      .insert({ name: newName.trim() })
      .select()
      .single();
    if (group) {
      await supabase.from("group_members").insert({ group_id: group.id, member_id: member.id });
      setNewName("");
      fetchGroups();
    }
    setCreating(false);
  }

  if (loading) return null;
  if (!member) return <NamePrompt />;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">SplitEasy 💸</h1>
        <span className="text-sm text-gray-500">Hey, {member.name}</span>
      </div>

      <form onSubmit={createGroup} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New group name..."
          required
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {creating ? "..." : "Create"}
        </button>
      </form>

      <h2 className="text-lg font-semibold mt-8 mb-3">All Groups</h2>
      {groups.length === 0 ? (
        <p className="text-gray-400 text-sm">No groups yet. Create one above.</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-green-400 transition"
              >
                <span className="font-medium">{g.name}</span>
                <span className="text-gray-400 text-sm">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
