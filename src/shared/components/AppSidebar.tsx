import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { Permission } from "@/features/auth";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, FolderKanban, ListChecks, Users } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Permission;
}

const NAV: NavItem[] = [
  { title: "Issues", url: "/issues", icon: ListChecks, permission: PERMISSIONS.issuesRead },
  { title: "Projects", url: "/projects", icon: FolderKanban, permission: PERMISSIONS.projectsRead },
  {
    title: "Organizations",
    url: "/organizations",
    icon: Building2,
    permission: PERMISSIONS.organizationsRead,
  },
  { title: "Users", url: "/users", icon: Users, permission: PERMISSIONS.usersRead },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { hasPermission } = useAuth();
  const navItems = NAV.filter((item) => hasPermission(item.permission));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md font-bold">Y</div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">YTInterface</span>
            <span className="text-muted-foreground text-xs">Internal portal</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = path === item.url || path.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
