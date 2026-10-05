"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Exam, SignOut } from "@phosphor-icons/react";
import { logoutAction } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "単語帳", icon: BookOpenText },
  { href: "/test", label: "テスト", icon: Exam },
];

export function AppHeader() {
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/login");
  return (
    <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="text-base font-bold tracking-tight">
          単語帳
        </Link>
        {!isLogin && (
          <nav className="flex gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    className="size-4"
                    weight={active ? "fill" : "regular"}
                  />
                  {label}
                </Link>
              );
            })}
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="ログアウト"
                title="ログアウト"
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              >
                <SignOut className="size-4" />
              </button>
            </form>
          </nav>
        )}
      </div>
    </header>
  );
}
