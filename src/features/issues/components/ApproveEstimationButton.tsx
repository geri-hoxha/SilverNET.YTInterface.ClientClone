import { useState } from "react";
import { CircleCheck, Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AWAITING_EST_APPROVAL = "Awaiting Est. Approval";

export function canApproveEstimation(clientState?: string) {
  return clientState === AWAITING_EST_APPROVAL;
}

const approveButtonClassName =
  "shrink-0 border border-emerald-200/70 bg-emerald-50 text-emerald-600 shadow-sm hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/70 dark:hover:text-emerald-300";

export function ApproveEstimationButton({
  clientState,
  onApprove,
  isPending = false,
  confirmBeforeApprove = false,
  issueTitle,
  variant = "compact",
  className,
}: {
  clientState?: string;
  onApprove: () => void;
  isPending?: boolean;
  confirmBeforeApprove?: boolean;
  issueTitle?: string;
  variant?: "icon" | "compact" | "text";
  className?: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!canApproveEstimation(clientState)) return null;

  const handleClick = () => {
    if (confirmBeforeApprove) {
      setConfirmOpen(true);
      return;
    }
    onApprove();
  };

  const handleConfirm = () => {
    onApprove();
    setConfirmOpen(false);
  };

  const button =
    variant === "text" ? (
      <Button
        type="button"
        size="sm"
        className={cn("h-8", approveButtonClassName, className)}
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CircleCheck className="mr-2 h-4 w-4" />
        )}
        Approve Estimation
      </Button>
    ) : variant === "compact" ? (
      <Button
        type="button"
        size="sm"
        className={cn("h-6 px-2 text-[11px] leading-none", approveButtonClassName, className)}
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
      </Button>
    ) : (
      <Button
        type="button"
        size="icon"
        className={cn("h-7 w-7", approveButtonClassName, className)}
        disabled={isPending}
        onClick={handleClick}
        aria-label="Approve estimation"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CircleCheck className="h-4 w-4" />
        )}
      </Button>
    );

  return (
    <>
      {button}

      {confirmBeforeApprove ? (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve estimation?</AlertDialogTitle>
              <AlertDialogDescription>
                {issueTitle
                  ? `Are you sure you want to approve the estimation for "${issueTitle}"?`
                  : "Are you sure you want to approve this estimation?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="border border-emerald-200/70 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                onClick={handleConfirm}
              >
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
