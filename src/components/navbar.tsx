"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Home,
  CalendarClock,
  CalendarSearch,
  Video,
  VenetianMask,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { ThemeSwitcher } from "./theme-switcher";

type Link = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const links: Link[] = [
  {
    label: "Home",
    href: "/",
    icon: <Home />,
  },
  {
    label: "Upcoming",
    href: "/upcoming",
    icon: <CalendarClock />,
  },
  {
    label: "Previous",
    href: "/previous",
    icon: <CalendarSearch />,
  },
  {
    label: "Recordings",
    href: "/recordings",
    icon: <Video />,
  },
  {
    label: "Personal Room",
    href: "/personal-room",
    icon: <VenetianMask />,
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center">
        <Link href="/" className="flex gap-2">
          <Video />
          <span className="font-extrabold hidden lg:block">TeleMed</span>
        </Link>
      </div>

      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <NavigationMenuItem key={link.label}>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <Link href={link.href} className="flex flex-row gap-2">
                    {link.icon}

                    <p className="hidden md:block">{link.label}</p>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  );
}
