"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftRight,
  Hash,
  LayoutDashboard,
  ListTodo,
  Loader2,
  Radar,
  Wallet,
} from "lucide-react";

export default function GlobalHeader() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleNavigate = (href: string) => {
    if (href === pathname) return;
    setIsNavigating(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-12 lg:px-24 h-14 flex items-center justify-between">
          <div className="font-headline font-bold text-primary">StockRadar</div>

          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/" aria-label="Radar" onClick={() => handleNavigate("/")}
              >
                <Radar className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="/wallet"
                aria-label="Wallet"
                onClick={() => handleNavigate("/wallet")}
              >
                <Wallet className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="/tickers"
                aria-label="Tickers"
                onClick={() => handleNavigate("/tickers")}
              >
                <Hash className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="/foreign-flow"
                aria-label="Foreign Flow"
                onClick={() => handleNavigate("/foreign-flow")}
              >
                <ArrowLeftRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="/dashboard"
                aria-label="Dashboard"
                onClick={() => handleNavigate("/dashboard")}
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/todo" aria-label="TODO" onClick={() => handleNavigate("/todo")}
              >
                <ListTodo className="h-5 w-5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {isNavigating && (
        <div className="fixed top-14 left-0 right-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-12 lg:px-24 h-10 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </div>
        </div>
      )}
    </>
  );
}
