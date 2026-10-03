"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "./auth-form";

/** Shown in place of a page that needs a signed-in customer. */
export function SignInGate() {
  const router = useRouter();
  return <AuthForm onDone={() => router.refresh()} />;
}
