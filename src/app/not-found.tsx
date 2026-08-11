"use client";

import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ErrorPageShell } from "@/components/errors/error-page-shell";
import { cn } from "@/utils/utils";

export default function NotFound() {
  return (
    <ErrorPageShell>
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border border-border/80 bg-card shadow-sm">
          <FileQuestion className="size-8 text-muted-foreground" strokeWidth={1.5} />
        </div>

        <p className="text-[5rem] font-semibold leading-none tracking-tighter text-foreground/10 select-none">
          404
        </p>

        <h1 className="-mt-10 text-2xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The page you are looking for doesn&apos;t exist or has moved.
        </p>

        <Link
          href="/"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 min-w-[10rem] gap-2",
          )}
        >
          <Home className="size-4" />
          Back home
        </Link>
      </div>
    </ErrorPageShell>
  );
}
