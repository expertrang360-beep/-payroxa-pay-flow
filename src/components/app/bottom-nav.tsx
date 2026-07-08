import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CreditCard, Wallet, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl">
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl transition-colors",
                    active ? "bg-primary-soft" : "bg-transparent",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
