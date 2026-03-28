"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = { id: string; name: string };

export default function InviteMember({
  groupId,
  existingMembers,
  onAdded,
}: {
  groupId: string;
  existingMembers: Member[];
  onAdded: () => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Find or create member by name
    let { data: existing } = await supabase
      .from("members")
      .select("id, name")
      .eq("name", name.trim())
      .single();

    if (!existing) {
      const { data: created } = await supabase
        .from("members")
        .insert({ name: name.trim() })
        .select()
        .single();
      existing = created;
    }

    if (!existing) {
      setError("Could not find or create member.");
      setLoading(false);
      return;
    }

    if (existingMembers.some((m) => m.id === existing!.id)) {
      setError("Already in this group.");
      setLoading(false);
      return;
    }

    await supabase.from("group_members").insert({ group_id: groupId, member_id: existing.id });
    setName("");
    setLoading(false);
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Friend's name..."
        required
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
      >
        {loading ? "..." : "Add"}
      </button>
      {error && <p className="text-red-500 text-sm w-full">{error}</p>}
    </form>
  );
}
