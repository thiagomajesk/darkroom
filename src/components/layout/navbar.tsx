"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [hasIssues, setHasIssues] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: { hasIssues?: boolean }) => {
        setHasIssues(data.hasIssues ?? false);
      })
      .catch(() => {});
  }, []);

  const links = [
    { href: "/", label: "Tools" },
    { href: "/gallery", label: "Gallery" },
  ];

  const isSettingsActive = pathname === "/settings";

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-6 border-b border-border/60 bg-card/90 px-6 shadow-sm shadow-black/20 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="grid h-7 w-7 grid-cols-2 gap-0.5 rounded-md bg-primary p-1.5">
          <span className="rounded-xs bg-primary-foreground/90" />
          <span className="rounded-xs bg-primary-foreground/50" />
          <span className="rounded-xs bg-primary-foreground/50" />
          <span className="rounded-xs bg-primary-foreground/90" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Darkroom</span>
      </Link>

      <nav className="flex items-center gap-1">
        {links.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className={cn(
          "relative ml-auto rounded-md p-2 transition-colors",
          isSettingsActive
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Settings className="size-4" />
        {hasIssues && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-400" />
        )}
      </Link>
    </header>
  );
}
