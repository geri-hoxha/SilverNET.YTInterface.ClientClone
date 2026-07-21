import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

export function FieldRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[180px_1fr] md:gap-6">
      <Label className="text-muted-foreground pt-2 text-sm">{label}</Label>
      <div>{children}</div>
    </div>
  );
}

export function ReadonlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <FieldRow label={label}>
      <p className="pt-2 text-sm">{value || "—"}</p>
    </FieldRow>
  );
}
