import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Card>
        <CardContent className="py-16 flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Construction className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Coming soon</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            This module will be wired up in a follow-up iteration. The
            authentication, API layer, and Issues module are ready and using
            the real backend at <code>https://localhost:7196/api</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/projects")({
  component: () => <ComingSoon title="Projects" />,
});
