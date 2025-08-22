'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Leaf, LineChart, ScrollText, Warehouse } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarMobile,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { useTranslation } from '@/hooks/use-translation';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';


function SidebarNavigation() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { isCollapsed } = useSidebar();

  const links = [
    { href: '/disease-diagnosis', label: t('sidebar_crop_disease'), icon: Leaf },
    { href: '/market-intelligence', label: t('sidebar_market_prices'), icon: LineChart },
    { href: '/government-schemes', label: t('sidebar_govt_schemes'), icon: ScrollText },
    { href: '/yield-prediction', label: t('sidebar_yield_prediction'), icon: Warehouse },
    { href: '/ai-assistant', label: t('sidebar_ai_assistant'), icon: Bot },
  ];
  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <h1 className={cn("text-xl font-bold text-foreground font-headline", isCollapsed && "hidden")}>
            KisanMitra
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(link.href)}
                className="justify-start"
                tooltip={{ children: link.label }}
              >
                <Link href={link.href}>
                  <link.icon className="h-5 w-5" />
                  <span className="font-body">{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  )
}

export function AppSidebar() {
  return (
    <>
      <Sidebar>
        <SidebarNavigation />
      </Sidebar>
      <SidebarMobile>
         <SidebarNavigation />
      </SidebarMobile>
    </>
  );
}
