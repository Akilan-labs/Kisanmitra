import type { FC, ReactNode } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
  className?: string;
};

export const PageHeader: FC<PageHeaderProps> = ({ title, children, className }) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6',
        className
      )}
    >
      <SidebarTrigger className="md:hidden" />
      <h1 className="flex-1 text-lg font-semibold md:text-xl font-headline">{title}</h1>
      {children}
    </header>
  );
};
