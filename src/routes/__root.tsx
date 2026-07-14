import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { reportLovableError } from "../lib/lovable-error-reporting";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-foreground text-7xl font-bold">404</h1>
        <h2 className="text-foreground mt-4 text-xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground mt-2 text-sm">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <a href="/" className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="text-muted-foreground mt-2 text-sm">Something went wrong. You can try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <a href="/" className="border-input bg-background text-foreground hover:bg-accent inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "YTInterface" },
      {
        name: "description",
        content: "Internal portal for managing YouTrack issues, projects, organizations, and users.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  ssr: false,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
