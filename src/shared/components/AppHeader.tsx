import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import ThemeToggle from "@/features/theme/ThemeToggle";
import { UserAvatar } from "@/shared/components/UserAvatar";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

function useBreadcrumbs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const parts = path.split("/").filter(Boolean);
  return parts.map((seg, i) => ({
    label: decodeURIComponent(seg).replace(/-/g, " "),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const crumbs = useBreadcrumbs();

  return (
    <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-3 backdrop-blur sm:gap-3 sm:px-4">
      <SidebarTrigger />
      <nav className="text-muted-foreground flex min-w-0 flex-1 scrollbar-none items-center gap-1 overflow-x-auto text-sm whitespace-nowrap">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            <Link to={c.href} className="hover:text-foreground capitalize transition-colors">
              {c.label}
            </Link>
          </span>
        ))}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <NotificationBell />
        <div className="flex items-center gap-2 px-1">
          <UserAvatar name={user?.fullName} seed={user?.id} className="h-7 w-7" />
          <div className="hidden min-w-0 text-left sm:block">
            <div className="truncate text-sm leading-none font-medium">{user?.fullName}</div>
            <div className="text-muted-foreground truncate text-xs">{user?.email}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8" onClick={logout} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
