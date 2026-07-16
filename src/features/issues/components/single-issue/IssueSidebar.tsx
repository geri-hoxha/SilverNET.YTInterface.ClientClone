import { IssueTypeBadge } from "@/shared/components/StatusBadge";
import { formatDate } from "@/shared/utils/format";

import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { Issue } from "../../types";
import { issueReadableId } from "../../utils";
import { LetterBadge, priorityColor, ProjectBadge, SidebarField } from "./IssueSidebarHelpers";

export function IssueSidebar({ issue }: { issue: Issue }) {
  const readable = issueReadableId(issue);
  const priorityText = issue.priorityLabel ?? issue.priority;

  return (
    <aside className="order-first w-full shrink-0 lg:order-last lg:w-fit">
      <div className="bg-card/40 space-y-3 rounded-md border p-3 text-sm">
        <SidebarField label="Project" badge={<ProjectBadge issue={issue} />}>
          <Button variant="link" asChild className="p-0 text-sky-700 dark:text-sky-400">
            <Link to="/projects">{issue.projectName}</Link>
          </Button>
        </SidebarField>

        <SidebarField label="Estimation">
          <span>{issue.estimation ?? "—"}</span>
        </SidebarField>

        <SidebarField label="State" badge={issue.status ? <LetterBadge text={issue.status} color="emerald" /> : null}>
          <span>{issue.clientState ?? "—"}</span>
        </SidebarField>

        <SidebarField label="Priority" badge={<LetterBadge text={priorityText} color={priorityColor(priorityText)} />}>
          <span>{priorityText}</span>
        </SidebarField>

        <SidebarField label="Type">
          <IssueTypeBadge issueType={issue.issueType || ""} />
        </SidebarField>

        <SidebarField label="Created">
          <span>{formatDate(issue.createdOnUtc)}</span>
        </SidebarField>

        <SidebarField label="Created by">{issue.createdByUserFullName ? <div>{issue.createdByUserFullName}</div> : <span>—</span>}</SidebarField>

        <SidebarField label="ID">
          <span className="font-mono text-xs">{readable}</span>
        </SidebarField>
      </div>
    </aside>
  );
}
