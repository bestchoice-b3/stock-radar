"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Todo, Wallet } from "@/types/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Star, Terminal, Trash2 } from "lucide-react";

const USER_ID_KEY = "supabase_user_email";

export default function TodoPage() {
  const sb = "error" in supabase ? null : supabase;
  const configError = "error" in supabase ? supabase.error : null;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState("");

  const [ticker, setTicker] = useState("");
  const [operation, setOperation] = useState("");
  const [note, setNote] = useState("");

  const [rows, setRows] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [walletRows, setWalletRows] = useState<Wallet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  useEffect(() => {
    const storedUserEmail = localStorage.getItem(USER_ID_KEY);
    if (storedUserEmail) setUserEmail(storedUserEmail);
  }, []);

  useEffect(() => {
    if (!sb) return;

    if (userEmail) {
      fetchTodos();
    } else {
      setRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, userEmail]);

  useEffect(() => {
    if (!sb) return;
    if (!userEmail) {
      setWalletRows([]);
      return;
    }

    const fetchWallet = async () => {
      const { data, error } = await sb
        .from("wallet")
        .select("id,created_at,ticker,user_id")
        .eq("user_id", userEmail);

      if (error) {
        setWalletRows([]);
        return;
      }

      setWalletRows((data as Wallet[]) || []);
    };

    fetchWallet();
  }, [sb, userEmail]);

  const walletTickers = useMemo(() => {
    return new Set(walletRows.map((w) => w.ticker));
  }, [walletRows]);

  const normalizedTicker = useMemo(() => ticker.trim().toUpperCase(), [ticker]);
  const normalizedOperation = useMemo(() => operation.trim(), [operation]);
  const normalizedNote = useMemo(() => note.trim(), [note]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEmail.trim()) return;
    const formattedEmail = tempEmail.trim();
    localStorage.setItem(USER_ID_KEY, formattedEmail);
    setUserEmail(formattedEmail);
  };

  async function fetchTodos() {
    if (!sb) return;
    if (!userEmail) return;

    setIsLoading(true);
    setError(null);

    const { data, error } = await sb
      .from("todo")
      .select("*")
      .eq("user_id", userEmail)
      .order("created_at", { ascending: false });

    if (error) {
      setError(`Erro ao buscar TODO: ${error.message}`);
      setRows([]);
    } else {
      setRows((data as Todo[]) || []);
    }

    setIsLoading(false);
  }

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    if (!userEmail) return;

    const t = normalizedTicker;
    const op = normalizedOperation;

    if (!t || !op) return;

    setIsSaving(true);
    setError(null);

    const { data, error } = await sb
      .from("todo")
      .insert([
        {
          ticker: t,
          operation: op,
          note: normalizedNote || null,
          user_id: userEmail,
        },
      ])
      .select()
      .single();

    if (error) {
      setError(`Erro ao cadastrar TODO: ${error.message}`);
    } else if (data) {
      setRows([data as Todo, ...rows]);
      setTicker("");
      setOperation("");
      setNote("");
    }

    setIsSaving(false);
  };

  const handleDelete = async (row: Todo) => {
    if (!sb) return;
    if (!userEmail) return;

    if (deletingId) return;

    setError(null);
    setDeletingId(row.id);

    const { error } = await sb
      .from("todo")
      .delete()
      .eq("id", row.id)
      .eq("user_id", userEmail);

    if (error) {
      setError(`Erro ao remover TODO: ${error.message}`);
      setDeletingId(null);
      return;
    }

    setRows(rows.filter((r) => r.id !== row.id));
    setDeletingId(null);
  };

  if (!sb) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
        <div className="z-10 w-full max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-8">TODO</h1>
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
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-8">TODO</h1>

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
        ) : (
          <>
            <Card className="p-6 mb-6" >
              <form onSubmit={handleAddTodo} className="grid gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    id="ticker"
                    placeholder="Ticker (ex: PETR4)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    disabled={isSaving}
                  />
                  <select
                    id="operation"
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                    disabled={isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="" disabled>
                      Selecione a operação
                    </option>
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                    <option value="SEE">SEE</option>
                  </select>
                </div>

                <Input
                  id="note"
                  placeholder="Nota (opcional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isSaving}
                />

                <Button type="submit" disabled={isSaving || !normalizedTicker || !normalizedOperation}>
                  {isSaving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    "Cadastrar"
                  )}
                </Button>
              </form>
            </Card>

            <div className="flex flex-wrap gap-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Carregando...</div>
              ) : rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum TODO cadastrado.</div>
              ) : (
                rows.map((row) => {
                  const cardClassName =
                    row.operation === "BUY"
                      ? "bg-[hsl(var(--chart-2))]/15 border-[hsl(var(--chart-2))]/40"
                      : row.operation === "SELL"
                        ? "bg-destructive/10 border-destructive/40"
                        : row.operation === "SEE"
                          ? "bg-blue-500/10 border-blue-500/30"
                          : "";

                  return (
                    <Card
                      key={row.id}
                      className={cn(
                        "px-3 py-2 w-[130px] h-[65px] cursor-pointer",
                        cardClassName
                      )}
                      onClick={() => setSelectedTodo(row)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedTodo(row);
                      }}
                    >
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <a
                              href={`https://statusinvest.com.br/acoes/${row.ticker}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-sm leading-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {row.ticker}
                            </a>
                            {walletTickers.has(row.ticker) && (
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 -mr-1 -mt-1"
                            disabled={deletingId === row.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(row);
                            }}
                            aria-label={`Remover ${row.ticker}`}
                          >
                            {deletingId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div className="mt-2 text-[8px] text-muted-foreground max-h-[40px] overflow-hidden">
                          {row.note ?? ""}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">Total: {rows.length}</div>

            <Dialog
              open={!!selectedTodo}
              onOpenChange={(open) => !open && setSelectedTodo(null)}
            >
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle className="font-headline">
                    {selectedTodo?.ticker}
                  </DialogTitle>
                </DialogHeader>
                <div className="text-sm whitespace-pre-wrap">
                  {selectedTodo?.note ?? ""}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </main>
  );
}
