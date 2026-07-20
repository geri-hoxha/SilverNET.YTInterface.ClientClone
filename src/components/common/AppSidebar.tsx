import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Building2, FolderKanban, ListChecks, Users } from "lucide-react";
import type { ComponentProps } from "react";

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { Permission } from "@/features/auth";
import { PERMISSIONS, useAuth } from "@/features/auth";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permission: Permission;
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Issues",
    url: "/issues",
    icon: ListChecks,
    permission: PERMISSIONS.issuesRead,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
    permission: PERMISSIONS.projectsRead,
  },
  {
    title: "Organizations",
    url: "/organizations",
    icon: Building2,
    permission: PERMISSIONS.organizationsRead,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    permission: PERMISSIONS.usersRead,
  },
];

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const { hasPermission } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/issues">
                <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold">Y</div>

                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">YTInterface</span>
                  <span className="text-muted-foreground truncate text-xs">Internal portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarMenu>
          {visibleItems.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);

            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link to={item.url}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
