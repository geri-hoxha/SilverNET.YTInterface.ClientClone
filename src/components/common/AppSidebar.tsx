import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";
import type { Permission } from "@/features/auth";
import { PERMISSIONS, useAuth } from "@/features/auth";
import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, FolderKanban, ListChecks, Users } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType;
  permission: Permission;
}

const NAV: NavItem[] = [
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { hasPermission } = useAuth();
  const navItems = NAV.filter((item) => hasPermission(item.permission));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="YTInterface">
              <Link to="/issues">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md text-sm font-bold">Y</div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">YTInterface</span>
                  <span className="truncate text-xs">Internal portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = path === item.url || path.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
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

      <SidebarRail />
    </Sidebar>
  );
}
