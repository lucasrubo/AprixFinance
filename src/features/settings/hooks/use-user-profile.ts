import { useEffect, useState } from "react";
import { createClient } from "@/shared/utils/supabase/client";
import { Database } from "@/shared/types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export function useUserProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setError("Usuário não autenticado");
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        setError("Erro ao carregar perfil");
        console.error("Error fetching user profile:", profileError);
      } else {
        setUser(userProfile);
      }
    } catch (err) {
      setError("Erro interno");
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return { user, loading, error, refetch: fetchUserProfile };
}
