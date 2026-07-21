import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("flex items-center justify-between gap-4", className)}>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {description ? <p className="text-muted-foreground mt-0.5 text-sm">{description}</p> : null}
    </div>
  );
}
