"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthNavLink() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard">Tableau de bord</Link>
        </Button>
        {/* Dropdown includes sign-out — lets you test the signed-out
            landing page flow without leaving the page. */}
        <UserButton afterSignOutUrl="/" />
      </div>
    );
  }

  return (
    <Button variant="secondary" size="sm" asChild>
      <Link href="/sign-in">Se connecter</Link>
    </Button>
  );
}
