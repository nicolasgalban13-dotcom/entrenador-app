"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Si NO hay sesión y no estás en login
      if (!session && pathname !== "/login") {
        router.push("/login");
      }
    };

    checkSession();
  }, [pathname]);

  return <>{children}</>;
}