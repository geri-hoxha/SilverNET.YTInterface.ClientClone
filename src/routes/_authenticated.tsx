import { AppHeader } from "@/components/common/AppHeader";
import { AppSidebar } from "@/components/common/AppSidebar";
import { SidebarProvider } from "@/components/common/sidebar/sidebar-provider";
import { SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAuth } from "@/features/auth";
import { NotificationsProvider } from "@/features/notifications/components/NotificationsProvider";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: requireAuth,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <NotificationsProvider>
      <SidebarProvider>
        <TooltipProvider>
          <div className="bg-muted/30 flex min-h-screen w-full">
            <AppSidebar />
            <SidebarInset className="flex flex-1 flex-col">
              <AppHeader />
              <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-6">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </TooltipProvider>
      </SidebarProvider>
    </NotificationsProvider>
  );
}
