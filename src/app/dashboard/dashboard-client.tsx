"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Loader2,
  Minus,
  Notebook,
  Star,
  Terminal,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Indicator, Wallet } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { getDm200Trend } from "@/lib/dm200";
import Dm200Arrow from "@/components/dm200-arrow";
import NotesModal from "@/components/notes-modal";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const USER_ID_KEY = "supabase_user_email";

type DashboardIndicator = {
  id: number;
  ticker: string;
  data_peaks_valleys: Indicator["data_peaks_valleys"];
  data_indicators: Indicator["data_indicators"];
  data_mt5?: {
    m9_signal?: "BUY" | "SELL" | "NEUTRAL" | string | null;
    volumeMoveAverage?: {
      signal?: "HIGH_VOLUME" | "LOW_VOLUME" | string | null;
    } | null;
  } | null;
};

type IndicatorsCommonVolume = {
  data_volume: {
    items: {
      [ticker: string]: {
        change: number;
      };
    };
  } | null;
} | null;

type ForeignFlowRow = {
  id: number;
  periodo: string | null;
  saldo: number | string | null;
};

const monthIndex: Record<string, number> = {
  Jan: 1,
  Fev: 2,
  Mar: 3,
  Abr: 4,
  Mai: 5,
  Jun: 6,
  Jul: 7,
  Ago: 8,
  Set: 9,
  Out: 10,
  Nov: 11,
  Dez: 12,
};

function parsePeriodo(periodo: string | null | undefined): number | null {
  if (!periodo) return null;
  const m = periodo.trim().match(/^([A-Za-zÀ-ÿ]{3})\/(\d{4})$/);
  if (!m) return null;
  const mon = monthIndex[m[1]];
  const year = Number(m[2]);
  if (!mon || Number.isNaN(year)) return null;
  return year * 100 + mon;
}

function comparePeriodoAsc(a: { periodo: string | null }, b: { periodo: string | null }) {
  const pa = parsePeriodo(a.periodo);
  const pb = parsePeriodo(b.periodo);
  if (pa !== null && pb !== null) return pa - pb;
  if (pa !== null) return -1;
  if (pb !== null) return 1;
  return String(a.periodo ?? "").localeCompare(String(b.periodo ?? ""));
}

function ForeignFlowLineChart({
  data,
}: {
  data: Array<{ periodo: string; saldo: number | null }>;
}) {
  const width = 900;
  const height = 220;
  const paddingX = 20;
  const paddingTop = 12;
  const paddingBottom = 28;

  const values = data.map((d) => d.saldo).filter((v): v is number => v != null);
  if (values.length === 0) {
    return <div className="text-sm text-muted-foreground">Nenhum dado para exibir.</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xStep = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;
  const innerHeight = height - paddingTop - paddingBottom;

  const pointAt = (index: number, saldo: number) => {
    const x = paddingX + index * xStep;
    const y = paddingTop + (1 - (saldo - min) / range) * innerHeight;
    return { x, y };
  };

  const points = data
    .map((d, i) => (d.saldo == null ? null : pointAt(i, d.saldo)))
    .filter(Boolean) as Array<{ x: number; y: number }>;

  const pathD = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  const zeroY = min <= 0 && max >= 0 ? pointAt(0, 0).y : null;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[220px]"
        role="img"
        aria-label="Foreign Flow line chart"
      >
        <rect x="0" y="0" width={width} height={height} fill="transparent" />

        {zeroY != null && (
          <line
            x1={paddingX}
            x2={width - paddingX}
            y1={zeroY}
            y2={zeroY}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity="0.6"
          />
        )}

        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />

        {data.map((d, i) => {
          if (d.saldo == null) return null;
          const p = pointAt(i, d.saldo);
          return (
            <circle
              key={d.periodo}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="hsl(var(--primary))"
            />
          );
        })}

        {data.map((d, i) => {
          const x = paddingX + i * xStep;
          const showLabel = i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2);
          if (!showLabel) return null;
          return (
            <text
              key={`label-${d.periodo}`}
              x={x}
              y={height - 10}
              textAnchor="middle"
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
            >
              {d.periodo}
            </text>
          );
        })}

        <text
          x={width - paddingX}
          y={paddingTop + 10}
          textAnchor="end"
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          {max.toFixed(2)}
        </text>
        <text
          x={width - paddingX}
          y={height - paddingBottom - 4}
          textAnchor="end"
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          {min.toFixed(2)}
        </text>
      </svg>

      <div className="mt-2 text-xs text-muted-foreground">
        Mostrando os últimos 12 períodos (ordenado por período, com o mais recente no final).
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const sb = "error" in supabase ? null : supabase;
  const configError = "error" in supabase ? supabase.error : null;

  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [indicators, setIndicators] = useState<DashboardIndicator[]>([]);
  const [commonData, setCommonData] = useState<IndicatorsCommonVolume>(null);
  const [walletRows, setWalletRows] = useState<Wallet[]>([]);

  const [foreignFlowRows, setForeignFlowRows] = useState<ForeignFlowRow[]>([]);
  const [isLoadingForeignFlow, setIsLoadingForeignFlow] = useState(false);
  const [foreignFlowError, setForeignFlowError] = useState<string | null>(null);

  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false);
  const [isLoadingCommon, setIsLoadingCommon] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [commonError, setCommonError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [openActionsTicker, setOpenActionsTicker] = useState<string | null>(null);
  const [notesTicker, setNotesTicker] = useState<string | null>(null);

  useEffect(() => {
    const storedUserEmail = localStorage.getItem(USER_ID_KEY);
    if (storedUserEmail) setUserEmail(storedUserEmail);
  }, []);

  useEffect(() => {
    if (!sb) return;

    const fetchIndicators = async () => {
      setIsLoadingIndicators(true);
      setError(null);
      const { data, error } = await sb
        .from("indicators")
        .select("id,ticker,data_peaks_valleys,data_indicators,data_mt5")
        .order("id", { ascending: false });

      if (error) {
        setError(error.message);
        setIndicators([]);
        setIsLoadingIndicators(false);
        return;
      }

      setIndicators(((data as DashboardIndicator[]) || []).filter(Boolean));
      setIsLoadingIndicators(false);
    };

    const fetchCommon = async () => {
      setIsLoadingCommon(true);
      setCommonError(null);
      const { data, error } = await sb
        .from("indicators_common")
        .select("data_volume")
        .limit(1)
        .single();

      if (error) {
        setCommonError(error.message);
        setCommonData(null);
        setIsLoadingCommon(false);
        return;
      }

      setCommonData((data as IndicatorsCommonVolume) ?? null);
      setIsLoadingCommon(false);
    };

    const fetchForeignFlow = async () => {
      setIsLoadingForeignFlow(true);
      setForeignFlowError(null);

      const { data, error } = await sb
        .from("b3_fluxo_estrangeiro")
        .select("id,periodo,saldo");

      if (error) {
        setForeignFlowError(error.message);
        setForeignFlowRows([]);
        setIsLoadingForeignFlow(false);
        return;
      }

      const cleaned = ((data as ForeignFlowRow[]) || [])
        .filter(Boolean)
        .filter((row) => !(row?.periodo && String(row.periodo).includes("*")))
        .slice()
        .sort(comparePeriodoAsc);

      const last12 = cleaned.slice(-12);

      setForeignFlowRows(last12);
      setIsLoadingForeignFlow(false);
    };

    fetchIndicators();
    fetchCommon();
    fetchForeignFlow();
  }, [sb]);

  useEffect(() => {
    if (!sb) return;
    if (!userEmail) {
      setWalletRows([]);
      return;
    }

    const fetchWallet = async () => {
      setIsLoadingWallet(true);
      setWalletError(null);
      const { data, error } = await sb
        .from("wallet")
        .select("id,created_at,ticker,user_id")
        .eq("user_id", userEmail);

      if (error) {
        setWalletError(error.message);
        setWalletRows([]);
        setIsLoadingWallet(false);
        return;
      }

      setWalletRows((data as Wallet[]) || []);
      setIsLoadingWallet(false);
    };

    fetchWallet();
  }, [sb, userEmail]);

  const walletTickers = useMemo(() => {
    return new Set(walletRows.map((w) => w.ticker));
  }, [walletRows]);

  const m200Buy = useMemo(() => {
    return indicators.filter((indicator) => {
      const trend = getDm200Trend(
        indicator.data_peaks_valleys?.signal_buy,
        indicator.data_peaks_valleys?.signal_sell
      );
      return trend === "up";
    });
  }, [indicators]);

  const m200Sell = useMemo(() => {
    return indicators.filter((indicator) => {
      const trend = getDm200Trend(
        indicator.data_peaks_valleys?.signal_buy,
        indicator.data_peaks_valleys?.signal_sell
      );
      return trend === "down";
    });
  }, [indicators]);

  const volumeTickers = useMemo(() => {
    return indicators.filter((indicator) => {
      return indicator.data_mt5?.volumeMoveAverage?.signal === "HIGH_VOLUME";
    });
  }, [indicators]);

  if (!sb) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
        <div className="z-10 w-full max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-8">
            Dashboard
          </h1>
        </div>
        <Alert variant="destructive" className="w-full max-w-7xl mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro de Configuração</AlertTitle>
          <AlertDescription>
            Não foi possível conectar ao Supabase. Verifique suas configurações.
            <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">
              {configError}
            </pre>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const StarBadge = ({ ticker }: { ticker: string }) => {
    if (!walletTickers.has(ticker)) return null;
    return <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />;
  };

  const isPageLoading =
    isLoadingIndicators ||
    isLoadingCommon ||
    (!!userEmail && isLoadingWallet) ||
    isLoadingForeignFlow;

  const foreignFlowChartData = useMemo(() => {
    return foreignFlowRows
      .map((r) => {
        const rawSaldo = r.saldo;
        const saldo = rawSaldo === null || rawSaldo === undefined ? null : Number(rawSaldo);
        return {
          periodo: r.periodo ?? "",
          saldo: saldo === null || Number.isNaN(saldo) ? null : saldo,
        };
      })
      .filter((x) => x.periodo);
  }, [foreignFlowRows]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="z-10 w-full max-w-7xl">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-8">
          Dashboard
        </h1>
      </div>

      {isPageLoading && (
        <div className="w-full max-w-7xl mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando...</span>
            </div>
          </Card>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="w-full max-w-7xl mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Buscar Dados</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os indicadores do Supabase.
            <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">
              {error}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      {commonError && (
        <Alert variant="destructive" className="w-full max-w-7xl mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Buscar Volume</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os dados de volume da tabela 'indicators_common'.
            <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">
              {commonError}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      {walletError && (
        <Alert variant="destructive" className="w-full max-w-7xl mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Buscar Wallet</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os tickers da sua wallet.
            <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">
              {walletError}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      {foreignFlowError && (
        <Alert variant="destructive" className="w-full max-w-7xl mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Buscar Foreign Flow</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os dados da tabela 'b3_fluxo_estrangeiro'.
            <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">
              {foreignFlowError}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full max-w-7xl">
        <h2 className="text-2xl font-headline font-bold text-primary mb-4">
          Foreign Flow (12M)
        </h2>

        <div className="mb-8">
          <Card className="p-4">
            {foreignFlowChartData.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhum dado para exibir.
              </div>
            ) : (
              <ForeignFlowLineChart data={foreignFlowChartData} />
            )}
          </Card>
        </div>

        <h2 className="text-2xl font-headline font-bold text-primary mb-4">M200</h2>

        <div className="mb-8">
          {m200Buy.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum ativo com sinal de compra.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {m200Buy.map((indicator) => {
                const signalBuy = indicator.data_peaks_valleys?.signal_buy;
                const signalSell = indicator.data_peaks_valleys?.signal_sell;
                const m9Signal = indicator.data_mt5?.m9_signal;
                const hasM9Buy = m9Signal === "BUY";
                const hasM9Sell = m9Signal === "SELL";

                const isOpen = openActionsTicker === indicator.ticker;

                return (
                  <Popover
                    key={indicator.id}
                    open={isOpen}
                    onOpenChange={(open) => setOpenActionsTicker(open ? indicator.ticker : null)}
                  >
                    <PopoverTrigger asChild>
                      <Card
                        className={cn(
                          "transition-colors bg-[hsl(var(--chart-2))]/15 border-[hsl(var(--chart-2))]/40 cursor-pointer"
                        )}
                      >
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{indicator.ticker}</span>
                            <div className="flex items-center gap-2">
                              <Dm200Arrow signalBuy={signalBuy} signalSell={signalSell} />
                              {hasM9Buy && (
                                <TrendingUp
                                  className="h-4 w-4 text-[hsl(var(--chart-2))]"
                                  aria-label="M9 BUY"
                                />
                              )}
                              {hasM9Sell && (
                                <TrendingDown
                                  className="h-4 w-4 text-destructive"
                                  aria-label="M9 SELL"
                                />
                              )}
                              <StarBadge ticker={indicator.ticker} />
                            </div>
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      side="bottom"
                      className="w-auto p-1"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setNotesTicker(indicator.ticker);
                            setOpenActionsTicker(null);
                          }}
                          aria-label={`Anotações ${indicator.ticker}`}
                        >
                          <Notebook className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={`https://statusinvest.com.br/acoes/${indicator.ticker}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Abrir StatusInvest ${indicator.ticker}`}
                            onClick={() => setOpenActionsTicker(null)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Fechar"
                          onClick={() => setOpenActionsTicker(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          )}
        </div>

        <div>
          {m200Sell.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum ativo com sinal de venda.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {m200Sell.map((indicator) => {
                const signalBuy = indicator.data_peaks_valleys?.signal_buy;
                const signalSell = indicator.data_peaks_valleys?.signal_sell;
                const m9Signal = indicator.data_mt5?.m9_signal;
                const hasM9Buy = m9Signal === "BUY";
                const hasM9Sell = m9Signal === "SELL";

                const isOpen = openActionsTicker === indicator.ticker;

                return (
                  <Popover
                    key={indicator.id}
                    open={isOpen}
                    onOpenChange={(open) => setOpenActionsTicker(open ? indicator.ticker : null)}
                  >
                    <PopoverTrigger asChild>
                      <Card
                        className={cn(
                          "transition-colors bg-destructive/10 border-destructive/40 cursor-pointer"
                        )}
                      >
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{indicator.ticker}</span>
                            <div className="flex items-center gap-2">
                              <Dm200Arrow signalBuy={signalBuy} signalSell={signalSell} />
                              {hasM9Buy && (
                                <TrendingUp
                                  className="h-4 w-4 text-[hsl(var(--chart-2))]"
                                  aria-label="M9 BUY"
                                />
                              )}
                              {hasM9Sell && (
                                <TrendingDown
                                  className="h-4 w-4 text-destructive"
                                  aria-label="M9 SELL"
                                />
                              )}
                              <StarBadge ticker={indicator.ticker} />
                            </div>
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      side="bottom"
                      className="w-auto p-1"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setNotesTicker(indicator.ticker);
                            setOpenActionsTicker(null);
                          }}
                          aria-label={`Anotações ${indicator.ticker}`}
                        >
                          <Notebook className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={`https://statusinvest.com.br/acoes/${indicator.ticker}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Abrir StatusInvest ${indicator.ticker}`}
                            onClick={() => setOpenActionsTicker(null)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Fechar"
                          onClick={() => setOpenActionsTicker(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-headline font-bold text-primary mb-4">Volume</h2>
          {volumeTickers.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum ativo com indicador de volume.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {volumeTickers.map((indicator) => {
                const signalBuy = indicator.data_peaks_valleys?.signal_buy;
                const signalSell = indicator.data_peaks_valleys?.signal_sell;
                const m9Signal = indicator.data_mt5?.m9_signal;
                const hasM9Buy = m9Signal === "BUY";
                const hasM9Sell = m9Signal === "SELL";
                const trend = getDm200Trend(signalBuy, signalSell);
                const isOpen = openActionsTicker === indicator.ticker;
                const trendClass =
                  trend === "up"
                    ? "bg-[hsl(var(--chart-2))]/15 border-[hsl(var(--chart-2))]/40"
                    : trend === "down"
                      ? "bg-destructive/10 border-destructive/40"
                      : "";

                return (
                  <Popover
                    key={indicator.id}
                    open={isOpen}
                    onOpenChange={(open) => setOpenActionsTicker(open ? indicator.ticker : null)}
                  >
                    <PopoverTrigger asChild>
                      <Card
                        className={cn(
                          "transition-colors cursor-pointer",
                          trendClass
                        )}
                      >
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{indicator.ticker}</span>
                            <div className="flex items-center gap-2">
                              <Dm200Arrow signalBuy={signalBuy} signalSell={signalSell} />
                              {hasM9Buy && (
                                <TrendingUp
                                  className="h-4 w-4 text-[hsl(var(--chart-2))]"
                                  aria-label="M9 BUY"
                                />
                              )}
                              {hasM9Sell && (
                                <TrendingDown
                                  className="h-4 w-4 text-destructive"
                                  aria-label="M9 SELL"
                                />
                              )}
                              <StarBadge ticker={indicator.ticker} />
                            </div>
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      side="bottom"
                      className="w-auto p-1"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setNotesTicker(indicator.ticker);
                            setOpenActionsTicker(null);
                          }}
                          aria-label={`Anotações ${indicator.ticker}`}
                        >
                          <Notebook className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={`https://statusinvest.com.br/acoes/${indicator.ticker}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Abrir StatusInvest ${indicator.ticker}`}
                            onClick={() => setOpenActionsTicker(null)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Fechar"
                          onClick={() => setOpenActionsTicker(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10 pt-4 border-t text-xs text-muted-foreground">
          <div className="font-medium mb-2">Legenda</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-[hsl(var(--chart-2))]" />
              <span>DM200: sinal de compra</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-destructive" />
              <span>DM200: sinal de venda</span>
            </div>
            {/* <div className="flex items-center gap-2">
              <Minus className="h-4 w-4" />
              <span>DM200: neutro</span>
            </div> */}
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span>Ticker está na sua wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[hsl(var(--chart-2))]" />
              <span>M9: sinal UP</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span>M9: sinal DOWN</span>
            </div>
          </div>
        </div>
      </div>

      <NotesModal isOpen={!!notesTicker} ticker={notesTicker} onClose={() => setNotesTicker(null)} />
    </main>
  );
}
