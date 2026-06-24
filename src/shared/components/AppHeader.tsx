import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import { UserAvatar } from "@/shared/components/UserAvatar";

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
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-3 sm:gap-3 sm:px-4 backdrop-blur">
      <SidebarTrigger />
      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap text-sm text-muted-foreground scrollbar-none">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            <Link
              to={c.href}
              className="capitalize hover:text-foreground transition-colors"
            >
              {c.label}
            </Link>
          </span>
        ))}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <NotificationBell />
        <div className="flex items-center gap-2 px-1">
          <UserAvatar name={user?.fullName} seed={user?.id} className="h-7 w-7" />
          <div className="hidden min-w-0 text-left sm:block">
            <div className="truncate text-sm font-medium leading-none">
              {user?.fullName}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {user?.email}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={logout}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
