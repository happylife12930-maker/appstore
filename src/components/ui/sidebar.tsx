'use client';

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { PanelLeft } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  side: "left" | "right";
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [open, setOpen] = React.useState(defaultOpen);

  const toggleSidebar = () => {
    setOpen(!open);
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${!open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  };

  React.useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`));
    if (cookie) {
      const value = cookie.split("=")[1];
      setOpen(value === "true");
    }
  }, []);

  React.useEffect(() => {
    if (isMobile) setOpen(false);
  }, [isMobile]);
  
  const state = open ? "expanded" : "collapsed";

  const value = {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  };

  return (
    <SidebarContext.Provider value={value as any}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
});

const sidebarButtonVariants = cva(
  "flex h-10 w-full items-center justify-start gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
  {
    variants: {
      isActive: {
        true: "bg-sidebar-primary/10 text-sidebar-primary",
        false: "text-sidebar-foreground/80 hover:bg-sidebar-muted",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean; tooltip?: string; }
>(({ className, asChild, isActive, tooltip, ...props }, ref) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const Comp = asChild ? Slot : "button";

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Comp ref={ref} className={cn(sidebarButtonVariants({ isActive, className }))} {...props} />
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <Comp ref={ref} className={cn(sidebarButtonVariants({ isActive, className }))} {...props} />;
});

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    collapsible?: "icon" | "button";
    side?: "left" | "right";
  }
>(({ className, collapsible, side = "left", ...props }, ref) => {
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side={side} className="w-[--sidebar-width-mobile] p-0">
          <SheetHeader className="sr-only">
             <SheetTitle>Menu</SheetTitle>
             <SheetDescription>Main navigation</SheetDescription>
          </SheetHeader>
          <div ref={ref} className={cn("h-full", className)} {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  const collapsed = state === "collapsed";

  return (
    <div
      ref={ref}
      className={cn(
        "h-full",
        "transition-[width] duration-300 ease-in-out",
        "data-[side=right]:border-l data-[side=left]:border-r",
        collapsed ? "w-[--sidebar-width-icon]" : "w-[--sidebar-width]",
        className
      )}
      data-side={side}
      {...props}
    />
  );
});

const SidebarInset = React.forwardRef<
  HTMLDivElement, 
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state, isMobile, side } = useSidebar();
  const collapsed = state === "collapsed";

  if (isMobile) {
    return <div ref={ref} className={cn(className)} {...props} />;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-300 ease-in-out",
        {
          "mr-[var(--sidebar-width)]": !collapsed && side === 'right',
          "ml-[var(--sidebar-width)]": !collapsed && side === 'left',
        },
        className
      )}
      {...props}
    />
  );
});

const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(({ className, ...props }, ref) => {
  const { isMobile, setOpenMobile, toggleSidebar } = useSidebar();

  if (isMobile) {
    return (
      <Button
        ref={ref}
        variant="outline"
        size="icon"
        className={cn("rounded-full", className)}
        onClick={() => setOpenMobile(true)}
        {...props}
      >
        <PanelLeft />
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            size="icon"
            className={cn("rounded-full", className)}
            onClick={toggleSidebar}
            {...props}
          >
            <PanelLeft />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Toggle sidebar (<span>{SIDEBAR_KEYBOARD_SHORTCUT}</span>)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex h-16 shrink-0 items-center", className)} {...props} />
));

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 overflow-y-auto", className)} {...props} />
));

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-2", className)} {...props} />
));

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mb-1 px-3 text-xs font-medium uppercase text-sidebar-foreground/50", className)} {...props} />
));

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
));

const SidebarMenu = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
));

const SidebarMenuItem = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props} />
));

SidebarProvider.displayName = "SidebarProvider";
Sidebar.displayName = "Sidebar";
SidebarInset.displayName = "SidebarInset";
SidebarTrigger.displayName = "SidebarTrigger";
SidebarHeader.displayName = "SidebarHeader";
SidebarContent.displayName = "SidebarContent";
SidebarFooter.displayName = "SidebarFooter";
SidebarGroup.displayName = "SidebarGroup";
SidebarGroupLabel.displayName = "SidebarGroupLabel";
SidebarGroupContent.displayName = "SidebarGroupContent";
SidebarMenu.displayName = "SidebarMenu";
SidebarMenuItem.displayName = "SidebarMenuItem";
SidebarMenuButton.displayName = "SidebarMenuButton";

export {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
};
