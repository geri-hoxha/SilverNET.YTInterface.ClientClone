import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: () => (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
          <Construction className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Coming soon</p>
        </CardContent>
      </Card>
    </div>
  ),
});
