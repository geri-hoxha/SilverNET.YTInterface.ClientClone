import { type VariantProps } from "class-variance-authority";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<VariantProps<typeof buttonVariants>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({ className, isActive, size = "icon", ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  text = "Previous",
  size = "default",
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string;
}) {
  return (
    <PaginationLink {...props} aria-label="Go to previous page" size={size} className={cn("gap-1 pl-2.5", className)}>
      <ChevronLeftIcon className="h-4 w-4" />
      <span>{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Next",
  size = "default",
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string;
}) {
  return (
    <PaginationLink {...props} aria-label="Go to next page" size={size} className={cn("gap-1 pr-2.5", className)}>
      <span>{text}</span>
      <ChevronRightIcon className="h-4 w-4" />
    </PaginationLink>
  );
}
