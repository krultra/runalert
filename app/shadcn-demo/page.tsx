"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToNewDemo() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/demo/shadcn");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-muted-foreground">
          This page has moved to{" "}
          <a href="/demo/shadcn" className="text-primary hover:underline">
            /demo/shadcn
          </a>
        </p>
      </div>
    </div>
  );
}
