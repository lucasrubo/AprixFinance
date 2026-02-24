import { createClient } from "@/shared/utils/supabase/client";
import { useEffect, useState } from "react";

export function useUserRole() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserRole() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setLoading(false);
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("tipo")
          .eq("id", user.id)
          .single();

        if (!profileError && userProfile) {
          setIsAdmin(userProfile.tipo === "admin");
        }
      } catch (err) {
        console.error("Error checking user role:", err);
      } finally {
        setLoading(false);
      }
    }

    checkUserRole();
  }, []);

  return { isAdmin, loading };
}
