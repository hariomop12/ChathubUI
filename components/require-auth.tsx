"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getGoogleProfile } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const profile = getGoogleProfile();

  useEffect(() => {
    if (!profile) router.replace("/");
  }, [profile, router]);

  if (!profile) {
    return null;
  }

  return <>{children}</>;
}
