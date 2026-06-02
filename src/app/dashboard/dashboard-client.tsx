"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowDown,
  ArrowUp,
  LayoutDashboard,
  ListTodo,
  Loader2,
  Minus,
  Star,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Indicator, Wallet } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { getDm200Trend } from "@/lib/dm200";
import Dm200Arrow from "@/components/dm200-arrow";
import { Button } from "@/components/ui/button";

const USER_ID_KEY = "supabase_user_email";

type DashboardIndicator = Pick<
  Indicator,
  "id" | "ticker" | "data_peaks_valleys" | "data_indicators"
>;

type IndicatorsCommonVolume = {
  data_volume: {
    items: {
      [ticker: string]: {
        change: number;
      };
    };
  } | null;
} | null;

export default function DashboardClient() {
  const sb = "error" in supabase ? null : supabase;
  const configError = "error" in supabase ? supabase.error : null;

  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [indicators, setIndicators] = useState<DashboardIndicator[]>([]);
  const [commonData, setCommonData] = useState<IndicatorsCommonVolume>(null);
  const [walletRows, setWalletRows] = useState<Wallet[]>([]);

  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false);
  const [isLoadingCommon, setIsLoadingCommon] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [commonError, setCommonError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

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
        .select("id,ticker,data_peaks_valleys,data_indicators")
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

    fetchIndicators();
    fetchCommon();
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
      const volumeData = commonData?.data_volume?.items?.[indicator.ticker];
      return !!(volumeData && volumeData.change > 1);
    });
  }, [indicators, commonData]);

  if (!sb) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
        <div className="z-10 w-full max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">
              Dashboard
            </h1>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard" aria-label="Dashboard">
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/todo" aria-label="TODO">
                  <ListTodo className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
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
    (!!userEmail && isLoadingWallet);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="z-10 w-full max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">
            Dashboard
          </h1>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard" aria-label="Dashboard">
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/todo" aria-label="TODO">
                <ListTodo className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
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

      <div className="w-full max-w-7xl">
        <h2 className="text-2xl font-headline font-bold text-primary mb-4">M200</h2>

        <div className="mb-8">
          {m200Buy.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum ativo com sinal de compra.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {m200Buy.map((indicator) => {
                const signalBuy = indicator.data_peaks_valleys?.signal_buy;
                const signalSell = indicator.data_peaks_valleys?.signal_sell;
                const indicatorsData = indicator.data_indicators?.items?.[0];
                const dy = indicatorsData?.dy;
                const mLiquida = indicatorsData?.m_liquida;

                return (
                  <Card
                    key={indicator.id}
                    className={cn(
                      "transition-colors bg-[hsl(var(--chart-2))]/15 border-[hsl(var(--chart-2))]/40"
                    )}
                  >
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{indicator.ticker}</span>
                        <div className="flex items-center gap-2">
                          <Dm200Arrow signalBuy={signalBuy} signalSell={signalSell} />
                          <StarBadge ticker={indicator.ticker} />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-xs text-muted-foreground">
                        DY: {dy != null ? `${dy.toFixed(2)}%` : "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ML: {mLiquida != null ? `${mLiquida.toFixed(2)}%` : "N/A"}
                      </div>
                    </CardContent>
                  </Card>
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
                const indicatorsData = indicator.data_indicators?.items?.[0];
                const dy = indicatorsData?.dy;
                const mLiquida = indicatorsData?.m_liquida;

                return (
                  <Card
                    key={indicator.id}
                    className={cn("transition-colors bg-destructive/10 border-destructive/40")}
                  >
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{indicator.ticker}</span>
                        <div className="flex items-center gap-2">
                          <Dm200Arrow signalBuy={signalBuy} signalSell={signalSell} />
                          <StarBadge ticker={indicator.ticker} />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-xs text-muted-foreground">
                        DY: {dy != null ? `${dy.toFixed(2)}%` : "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ML: {mLiquida != null ? `${mLiquida.toFixed(2)}%` : "N/A"}
                      </div>
                    </CardContent>
                  </Card>
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
                const indicatorsData = indicator.data_indicators?.items?.[0];
                const dy = indicatorsData?.dy;
                const mLiquida = indicatorsData?.m_liquida;
                const trend = getDm200Trend(signalBuy, signalSell);
                const trendClass =
                  trend === "up"
                    ? "bg-[hsl(var(--chart-2))]/15 border-[hsl(var(--chart-2))]/40"
                    : trend === "down"
                      ? "bg-destructive/10 border-destructive/40"
                      : "";

                return (
                  <Card key={indicator.id} className={cn("transition-colors", trendClass)}>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{indicator.ticker}</span>
                        <div className="flex items-center gap-2">
                          <Dm200Arrow signalBuy={signalBuy} signalSell={signalSell} />
                          <StarBadge ticker={indicator.ticker} />
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-xs text-muted-foreground">
                        DY: {dy != null ? `${dy.toFixed(2)}%` : "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ML: {mLiquida != null ? `${mLiquida.toFixed(2)}%` : "N/A"}
                      </div>
                    </CardContent>
                  </Card>
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
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4" />
              <span>DM200: neutro</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span>Ticker está na sua wallet</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
