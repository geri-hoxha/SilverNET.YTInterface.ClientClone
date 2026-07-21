import { PanelLeftIcon } from "lucide-react";
import { Slot } from "radix-ui";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useSidebar } from "../common/sidebar/sidebar-provider";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "./drawer";

const SIDEBAR_WIDTH_MOBILE = "18rem";

type SidebarProps = React.ComponentProps<"div"> & {
  side?: "left" | "right";
  collapsible?: "icon";
};

function Sidebar({ side = "left", collapsible = "icon", className, children, dir, ...props }: SidebarProps) {
  const { isDesktop, state, openMobile, setOpenMobile } = useSidebar();

  if (!isDesktop) {
    return (
      <Drawer open={openMobile} onOpenChange={setOpenMobile} direction={side}>
        <DrawerContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          hasHandle={false}
          className={cn("bg-background text-foreground", "w-(--sidebar-width) p-0 sm:max-w-(--sidebar-width)")}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
        >
          <DrawerHeader className="sr-only">
            <DrawerTitle>Sidebar</DrawerTitle>
            <DrawerDescription>Displays the mobile sidebar.</DrawerDescription>
          </DrawerHeader>

          <div className="flex h-full w-full flex-col">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="group peer text-sidebar-foreground hidden md:block" data-state={state} data-collapsible={state === "collapsed" ? collapsible : undefined} data-side={side} data-slot="sidebar">
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent",
          "ease-in-out-custom transition-[width] duration-300",
          "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          "group-data-[side=right]:rotate-180",
        )}
      />

      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width)",
          "ease-in-out-custom transition-[left,right,width] duration-300",
          "data-[side=left]:left-0",
          "data-[side=right]:right-0",
          "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          "data-[side=left]:border-r",
          "data-[side=right]:border-l",
          "md:flex",
          className,
        )}
        {...props}
      >
        <div data-sidebar="sidebar" data-slot="sidebar-inner" className={cn("bg-sidebar text-sidebar-foreground", "flex size-full flex-col")}>
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return <main data-slot="sidebar-inset" className={cn("bg-background relative flex min-w-0 h-svh flex-1 flex-col", className)} {...props} />;
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      className={cn("size-8", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" data-sidebar="header" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn("no-scrollbar flex min-h-0 flex-1 flex-col gap-2", "overflow-auto", "group-data-[collapsible=icon]:overflow-hidden", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />;
}

type SidebarMenuButtonProps = React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  size?: "default" | "sm" | "lg";
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
};

function SidebarMenuButton({ asChild = false, isActive = false, size = "default", tooltip, className, ...props }: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const { isDesktop, state } = useSidebar();

  const sizeClassName = size === "lg" ? "h-12 text-sm group-data-[collapsible=icon]:p-0!" : size === "sm" ? "h-7 text-xs" : "h-8 text-sm";

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "peer/menu-button group/menu-button flex w-full",
        "items-center gap-2 overflow-hidden rounded-md p-2",
        "text-sidebar-foreground text-left text-sm",
        "ring-sidebar-ring outline-hidden",
        "transition-[width,height,padding]",
        "hover:bg-sidebar-accent",
        "hover:text-sidebar-accent-foreground",
        "focus-visible:ring-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-disabled:pointer-events-none",
        "aria-disabled:opacity-50",
        "data-[active=true]:bg-muted",
        "data-[active=true]:font-medium",
        "data-[active=true]:text-sidebar-accent-foreground",
        "group-data-[collapsible=icon]:size-8!",
        "group-data-[collapsible=icon]:p-2!",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        "[&>span:last-child]:truncate",
        sizeClassName,
        className,
      )}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  const tooltipProps = typeof tooltip === "string" ? { children: tooltip } : tooltip;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>

      <TooltipContent side="right" align="center" hidden={state !== "collapsed" || !isDesktop} {...tooltipProps} />
    </Tooltip>
  );
}

export { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger };
