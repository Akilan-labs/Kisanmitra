
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
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';

const links = [
  { href: '/disease-diagnosis', label: 'Crop Disease', icon: Leaf },
  { href: '/market-intelligence', label: 'Market Prices', icon: LineChart },
  { href: '/government-schemes', label: 'Govt. Schemes', icon: ScrollText },
  { href: '/yield-prediction', label: 'Yield Prediction', icon: Warehouse },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Icons.logo className="h-8 w-8 text-accent" />
          <h1 className="text-xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden font-headline">
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
                isActive={pathname === link.href}
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
    </Sidebar>
  );
}
