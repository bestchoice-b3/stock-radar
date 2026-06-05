"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { TickerRow } from "@/types/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Terminal, Trash2 } from "lucide-react";

const USER_ID_KEY = "supabase_user_email";
const ADMIN_EMAIL = "anaelj@gmail.com";

export default function TickersPage() {
  const sb = "error" in supabase ? null : supabase;
  const configError = "error" in supabase ? supabase.error : null;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState("");

  const [rows, setRows] = useState<TickerRow[]>([]);
  const [ticker, setTicker] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedTicker = useMemo(() => ticker.trim().toUpperCase(), [ticker]);
  const canInsert = userEmail === ADMIN_EMAIL;

  const sortByTicker = (items: TickerRow[]) =>
    [...items].sort((a, b) =>
      (a.ticker ?? "")
        .trim()
        .localeCompare((b.ticker ?? "").trim(), "pt-BR", { sensitivity: "base" })
    );

  useEffect(() => {
    const storedUserEmail = localStorage.getItem(USER_ID_KEY);
    if (storedUserEmail) setUserEmail(storedUserEmail);
  }, []);

  useEffect(() => {
    if (!userEmail) {
      setRows([]);
      return;
    }
    if (!canInsert) {
      setRows([]);
      return;
    }
    fetchTickers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, canInsert]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEmail.trim()) return;
    const formattedEmail = tempEmail.trim();
    localStorage.setItem(USER_ID_KEY, formattedEmail);
    setUserEmail(formattedEmail);
  };

  async function fetchTickers() {
    if (!sb) return;
    if (!canInsert) return;

    setIsLoading(true);
    setError(null);

    const { data, error } = await sb
      .from("tickers")
      .select("*")
      .order("ticker", { ascending: true });

    if (error) {
      setError(`Erro ao buscar tickers: ${error.message}`);
      setRows([]);
    } else {
      setRows(sortByTicker(((data as TickerRow[]) ?? []).filter((r) => !!r.ticker)));
    }

    setIsLoading(false);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;

    if (!canInsert) {
      setError("Apenas anaelj@gmail.com pode inserir nessa tabela.");
      return;
    }

    const t = normalizedTicker;
    if (!t) return;

    if (rows.some((r) => r.ticker === t)) {
      setError(`Ticker já cadastrado: ${t}`);
      return;
    }

    setIsSaving(true);
    setError(null);

    const { data, error } = await sb
      .from("tickers")
      .insert([{ ticker: t }])
      .select()
      .single();

    if (error) {
      setError(`Erro ao inserir ticker: ${error.message}`);
    } else if (data) {
      setRows(
        sortByTicker([data as TickerRow, ...rows])
      );
      setTicker("");
    }

    setIsSaving(false);
  };

  const handleDelete = async (row: TickerRow) => {
    if (!sb) return;

    if (!canInsert) {
      setError("Apenas anaelj@gmail.com pode remover nessa tabela.");
      return;
    }

    setDeletingId(row.id);
    setError(null);

    const { error } = await sb.from("tickers").delete().eq("id", row.id);

    if (error) {
      setError(`Erro ao remover ticker: ${error.message}`);
      setDeletingId(null);
      return;
    }

    setRows(rows.filter((r) => r.id !== row.id));
    setDeletingId(null);
  };

  if ("error" in supabase) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
        <div className="z-10 w-full max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-8">
            Tickers
          </h1>
        </div>
        <Alert variant="destructive" className="w-full max-w-4xl mb-8">
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

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="z-10 w-full max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-8">
          Tickers
        </h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!userEmail ? (
          <Card className="p-6">
            <form onSubmit={handleEmailSubmit} className="grid gap-4">
              <Input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                required
              />
              <Button type="submit">Salvar E-mail e Continuar</Button>
            </form>
          </Card>
        ) : !canInsert ? (
          <>
            <Alert variant="destructive" className="mb-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Acesso restrito</AlertTitle>
              <AlertDescription>
                Esta página é restrita ao usuário <span className="font-medium">anaelj@gmail.com</span>.
                {userEmail ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Logado como: <span className="font-medium">{userEmail}</span>
                  </div>
                ) : null}
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem(USER_ID_KEY);
                setUserEmail(null);
                setTempEmail("");
                setRows([]);
              }}
            >
              Trocar e-mail
            </Button>
          </>
        ) : (
          <>
            <Card className="p-6 mb-6">
              <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
                <Input
                  id="ticker"
                  placeholder="Adicionar ticker (ex: PETR4)"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  disabled={isSaving || !canInsert}
                />
                <Button type="submit" disabled={isSaving || !normalizedTicker || !canInsert}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar"}
                </Button>
              </form>
            </Card>

            <div className="flex flex-wrap gap-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Carregando...</div>
              ) : rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum ticker cadastrado.</div>
              ) : (
                rows.map((row) => (
                  <Card key={row.id} className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{row.ticker}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={!canInsert || deletingId === row.id}
                        onClick={() => handleDelete(row)}
                        aria-label={`Remover ${row.ticker}`}
                      >
                        {deletingId === row.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">Total: {rows.length}</div>
          </>
        )}
      </div>
    </main>
  );
}
