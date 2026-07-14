import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/AppSidebar";
import { AppHeader } from "@/shared/components/AppHeader";
import { requireAuth } from "@/features/auth";
import { NotificationsProvider } from "@/features/notifications/components/NotificationsProvider";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: requireAuth,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <NotificationsProvider>
      <SidebarProvider>
        <div className="bg-muted/30 flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-1 flex-col">
            <AppHeader />
            <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </NotificationsProvider>
  );
}
