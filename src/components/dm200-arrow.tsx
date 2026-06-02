import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { getDm200Trend } from "@/lib/dm200";

type Dm200ArrowProps = {
  signalBuy?: boolean | null;
  signalSell?: boolean | null;
  className?: string;
};

export default function Dm200Arrow({
  signalBuy,
  signalSell,
  className,
}: Dm200ArrowProps) {
  const trend = getDm200Trend(signalBuy, signalSell);

  if (trend === "neutral") {
    return <Minus className={className ?? "h-5 w-5 text-muted-foreground"} />;
  }

  if (trend === "up") {
    return <ArrowUp className={className ?? "h-5 w-5 text-[hsl(var(--chart-2))]"} />;
  }

  return <ArrowDown className={className ?? "h-5 w-5 text-destructive"} />;
}
