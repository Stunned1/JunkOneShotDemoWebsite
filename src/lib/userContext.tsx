"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = { id: string; name: string };

type UserContextType = {
  member: Member | null;
  setMemberName: (name: string) => Promise<void>;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  member: null,
  setMemberName: async () => {},
  loading: true,
});

const TEST_NAME = "Tester";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login as test user
    setMemberName(TEST_NAME).then(() => setLoading(false));
  }, []);

  async function setMemberName(name: string) {
    const { data } = await supabase
      .from("members")
      .upsert({ name }, { onConflict: "name" })
      .select()
      .single();

    if (data) {
      localStorage.setItem("member", JSON.stringify(data));
      setMember(data);
    }
  }

  return (
    <UserContext.Provider value={{ member, setMemberName, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
