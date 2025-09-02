
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { VariantProps, cva } from 'class-variance-authority';
import { PanelLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center [&>span:last-child]:truncate [&>svg]:size-5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
      },
      size: {
        default: 'h-9 text-sm',
        sm: 'h-8 text-xs',
        lg: 'h-12 text-sm group-data-[collapsible=icon]:!p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// --- Context and Provider ---
type SidebarContextValue = {
  isCollapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMounted: boolean;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultCollapsed,
}: {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [isCollapsed, setCollapsed] = React.useState(defaultCollapsed ?? false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('sidebar-collapsed='))
      ?.split('=')[1];
    if (cookieValue) {
      setCollapsed(cookieValue === 'true');
    }
  }, []);

  React.useEffect(() => {
    if (isMounted) {
      document.cookie = `sidebar-collapsed=${isCollapsed}; path=/; max-age=604800`;
    }
  }, [isCollapsed, isMounted]);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarContext.Provider value={{ isCollapsed, setCollapsed, isMounted }}>
        {children}
      </SidebarContext.Provider>
    </TooltipProvider>
  );
}


// --- Main Components ---

export const Sidebar = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => {
  const { isCollapsed } = useSidebar();
  return (
    <aside
      ref={ref}
      data-collapsed={isCollapsed}
      className={cn(
        'group fixed inset-y-0 left-0 z-20 hidden h-full flex-col border-r bg-background transition-all duration-300 ease-in-out data-[collapsed=true]:w-16 md:flex',
         isCollapsed ? 'w-16' : 'w-64',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';


export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { isCollapsed, setCollapsed } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn('size-8 rounded-full', className)}
      onClick={() => setCollapsed(!isCollapsed)}
      {...props}
    >
      <PanelLeft className={cn('size-4 transition-transform', isCollapsed && 'rotate-180')} />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
});
SidebarTrigger.displayName = 'SidebarTrigger';


export const SidebarMobile = ({ children }: { children: React.ReactNode }) => {
  return (
     <Sheet>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
           <SheetHeader className="p-3">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            {children}
          </div>
        </SheetContent>
    </Sheet>
  )
}

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed } = useSidebar();
  return (
    <main
      ref={ref}
      className={cn(
        "flex-1 transition-[margin-left] duration-200 ease-in-out",
        'md:ml-64 group-[[data-collapsed=true]]:md:ml-16',
        isCollapsed ? 'md:ml-16' : 'md:ml-64',
        className
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = 'SidebarInset';


// --- Building Blocks ---

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 p-3', className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed } = useSidebar();
  return (
    <div
      ref={ref}
      data-collapsed={isCollapsed}
      className={cn(
        'flex flex-1 flex-col gap-2 overflow-auto p-2 group-data-[collapsed=true]:items-center group-data-[collapsed=true]:overflow-hidden group-data-[collapsed=true]:p-3',
        className
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = 'SidebarContent';

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('mt-auto flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = 'SidebarFooter';

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex w-full min-w-0 flex-col gap-1', className)}
    {...props}
  />
));
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('group/menu-item relative', className)}
    {...props}
  />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = 'default',
      size = 'default',
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const { isCollapsed } = useSidebar();

    const button = (
      <Comp
        ref={ref}
        data-active={isActive}
        className={cn(
          sidebarMenuButtonVariants({ variant, size }),
          isCollapsed && 'group-data-[collapsed=true]:size-9 group-data-[collapsed=true]:p-2 group-data-[collapsed=true]:justify-center',
          className
        )}
        {...props}
      />
    );

    if (!tooltip) {
      return button;
    }

    if (typeof tooltip === 'string') {
      tooltip = {
        children: tooltip,
      };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={8}
          hidden={!isCollapsed}
          {...tooltip}
        />
      </Tooltip>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';
