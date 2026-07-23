import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { useIssue } from "../../hooks";
import { issueDetailRouteApi } from "../../route";
import { IssueMainContent } from "./IssueMainContent";
import { IssueSidebar } from "./IssueSidebar";

export function IssueDetailPage() {
  const { id } = issueDetailRouteApi.useParams();
  const issue = useIssue(id);

  if (issue.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (issue.isError || !issue.data) {
    return (
      <div className="mx-auto max-w-6xl">
        <Alert variant="destructive">
          <AlertDescription>{(issue.error as Error)?.message ?? "Issue not found."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = issue.data;

  return (
    <div className="h-full w-full overflow-auto p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <IssueMainContent id={id} issue={data} />
        <IssueSidebar issue={data} />
      </div>
    </div>
  );
}
