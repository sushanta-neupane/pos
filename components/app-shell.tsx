"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type NavItem = { href: string; label: string; adminOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", adminOnly: true },
  { href: "/products", label: "Products" },
  { href: "/stock", label: "Add Stock" },
  { href: "/pos", label: "POS (Sell)" },
  { href: "/alerts", label: "Alerts", adminOnly: true },
];

function Icon({
  name,
  className,
}: {
  name: "dashboard" | "box" | "plus" | "cart" | "bell";
  className?: string;
}) {
  const common = cn("h-4 w-4", className);
  switch (name) {
    case "dashboard":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 13.5V6.5A2.5 2.5 0 0 1 6.5 4h2A2.5 2.5 0 0 1 11 6.5v7A2.5 2.5 0 0 1 8.5 16h-2A2.5 2.5 0 0 1 4 13.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M13 17.5v-11A2.5 2.5 0 0 1 15.5 4h2A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-2A2.5 2.5 0 0 1 13 17.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "box":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 8.5V16a3 3 0 0 1-1.6 2.65l-6 3.2a3 3 0 0 1-2.8 0l-6-3.2A3 3 0 0 1 3 16V8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 2.8 3.8 7.3a2 2 0 0 0 0 3.4L12 15l8.2-4.3a2 2 0 0 0 0-3.4L12 2.8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 15v7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "plus":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "cart":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H8.2a2 2 0 0 1-2-1.6L4 3H2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            fill="currentColor"
          />
        </svg>
      );
    case "bell":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 22a2.2 2.2 0 0 0 2-2H10a2.2 2.2 0 0 0 2 2Z"
            fill="currentColor"
          />
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function navIcon(href: string) {
  if (href === "/dashboard") return "dashboard";
  if (href === "/products") return "box";
  if (href === "/stock") return "plus";
  if (href === "/pos") return "cart";
  return "bell";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useSession();
  const role = data?.user?.role;

  const [q, setQ] = React.useState("");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  }

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
          <aside className="hidden md:block border-r bg-muted/30">
            <div className="h-14 px-4 flex items-center gap-2 border-b bg-background">
              <div className="h-9 w-9 rounded-full border grid place-items-center bg-background">
                <div className="h-5 w-5 rounded-full bg-foreground" />
              </div>
              <div className="text-sm font-semibold tracking-tight">D-inventy</div>
            </div>
            <nav className="p-3 space-y-1">
              {NAV.filter((i) => !i.adminOnly || role === "ADMIN").map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const iconName = navIcon(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-sm border border-transparent px-3 py-2 text-sm hover:bg-background/70",
                      active && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Icon
                      name={iconName}
                      className={cn(
                        active
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground/70"
                      )}
                    />
                    <span className={cn("truncate", active && "font-medium")}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              {role === "ADMIN" ? (
                <div className="pt-3 mt-3 border-t">
                  <Link
                    href="/dashboard/users"
                    className={cn(
                      "group flex items-center gap-3 rounded-sm border border-transparent px-3 py-2 text-sm hover:bg-background/70",
                      pathname.startsWith("/dashboard/users") &&
                        "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <svg
                      className={cn(
                        "h-4 w-4",
                        pathname.startsWith("/dashboard/users")
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground/70"
                      )}
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M4 20a8 8 0 0 1 16 0"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Users
                  </Link>
                </div>
              ) : null}
            </nav>
          </aside>

          <div className="bg-[hsl(210_40%_98%)]">
            <header className="sticky top-0 z-10 h-14 border-b bg-[hsl(210_40%_98%)] px-4 sm:px-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 md:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open menu"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Button>

                <div className="text-lg font-semibold tracking-tight text-primary truncate">
                  {pathname.startsWith("/dashboard")
                    ? "Dashboard"
                    : pathname.startsWith("/products")
                    ? "Products"
                    : pathname.startsWith("/stock")
                    ? "Add Stock"
                    : pathname.startsWith("/pos")
                    ? "POS"
                    : pathname.startsWith("/alerts")
                    ? "Alerts"
                    : "Inventory"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <form onSubmit={onSearch} className="hidden sm:block">
                  <div className="relative">
                    <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M16.5 16.5 21 21"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search anything…"
                      className="h-9 w-[320px] rounded-full pl-8 bg-background"
                    />
                  </div>
                </form>

                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                  <Icon name="bell" className="text-muted-foreground" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="h-9 w-9 rounded-full border bg-background grid place-items-center text-xs font-semibold"
                      aria-label="User menu"
                    >
                      {(data?.user?.email?.[0] ?? "U").toUpperCase()}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      {data?.user?.email ?? "User"}
                    </div>
                    <div className="px-2 pb-1.5 text-xs text-muted-foreground">
                      Role: {role ?? "—"}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        signOut({ callbackUrl: "/login" });
                      }}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <main className="p-4 sm:p-5">{children}</main>
          </div>
        </div>
      </div>

      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogContent className="fixed left-0 top-0 bottom-0 z-50 w-[86%] max-w-sm translate-x-0 translate-y-0 rounded-none border-r p-0">
          <div className="h-14 px-4 flex items-center gap-2 border-b bg-background">
            <button
              type="button"
              className="h-9 w-9 rounded-full border grid place-items-center bg-background"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <div className="text-sm font-semibold tracking-tight">D-inventy</div>
          </div>
          <nav className="p-3 space-y-1">
            {NAV.filter((i) => !i.adminOnly || role === "ADMIN").map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const iconName = navIcon(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-sm border border-transparent px-3 py-2 text-sm hover:bg-background/70",
                    active && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <Icon
                    name={iconName}
                    className={cn(
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground/70"
                    )}
                  />
                  <span className={cn("truncate", active && "font-medium")}>{item.label}</span>
                </Link>
              );
            })}
            {role === "ADMIN" ? (
              <div className="pt-3 mt-3 border-t">
                <Link
                  href="/dashboard/users"
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-sm border border-transparent px-3 py-2 text-sm hover:bg-background/70",
                    pathname.startsWith("/dashboard/users") &&
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <svg
                    className={cn(
                      "h-4 w-4",
                      pathname.startsWith("/dashboard/users")
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground/70"
                    )}
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Users
                </Link>
              </div>
            ) : null}
          </nav>
        </DialogContent>
      </Dialog>
    </div>
  );
}
