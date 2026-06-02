export type Dm200Trend = "up" | "down" | "neutral";

export function getDm200Trend(
  signalBuy?: boolean | null,
  signalSell?: boolean | null
): Dm200Trend {
  if (!!signalBuy && !signalSell) return "up";
  if (!signalBuy && !!signalSell) return "down";
  return "neutral";
}
