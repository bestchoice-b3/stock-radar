"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Wallet } from "@/types/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Terminal, Trash2 } from "lucide-react";

const USER_ID_KEY = "supabase_user_email";

export default function WalletPage() {
  const sb = "error" in supabase ? null : supabase;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState("");
  const [ticker, setTicker] = useState("");
  const [rows, setRows] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUserEmail = localStorage.getItem(USER_ID_KEY);
    if (storedUserEmail) {
      setUserEmail(storedUserEmail);
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchWallet();
    } else {
      setRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const normalizedTicker = useMemo(() => ticker.trim().toUpperCase(), [ticker]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEmail.trim()) return;
    const formattedEmail = tempEmail.trim();
    localStorage.setItem(USER_ID_KEY, formattedEmail);
    setUserEmail(formattedEmail);
  };

  async function fetchWallet() {
    if (!userEmail) return;
    if (!sb) return;

    setIsLoading(true);
    setError(null);

    const { data, error } = await sb
      .from("wallet")
      .select("*")
      .eq("user_id", userEmail)
      .order("created_at", { ascending: false });

    if (error) {
      setError(`Erro ao buscar wallet: ${error.message}`);
      setRows([]);
    } else {
      setRows((data as Wallet[]) || []);
    }

    setIsLoading(false);
  }

  const handleAddTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;
    if (!sb) return;

    const t = normalizedTicker;
    if (!t) return;

    setIsSaving(true);
    setError(null);

    const { data, error } = await sb
      .from("wallet")
      .insert([{ ticker: t, user_id: userEmail }])
      .select()
      .single();

    if (error) {
      setError(`Erro ao cadastrar ticker: ${error.message}`);
    } else if (data) {
      setRows([data as Wallet, ...rows]);
      setTicker("");
    }

    setIsSaving(false);
  };

  const handleDelete = async (row: Wallet) => {
    if (!userEmail) return;
    if (!sb) return;

    setError(null);

    const { error } = await sb
      .from("wallet")
      .delete()
      .eq("id", row.id)
      .eq("user_id", userEmail);

    if (error) {
      setError(`Erro ao remover ticker: ${error.message}`);
      return;
    }

    setRows(rows.filter((r) => r.id !== row.id));
  };

  if ("error" in supabase) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
        <div className="z-10 w-full max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-8">
            Wallet
          </h1>
        </div>
        <Alert variant="destructive" className="w-full max-w-4xl mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro de Configuração</AlertTitle>
          <AlertDescription>
            Não foi possível conectar ao Supabase. Verifique suas configurações.
            <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">
              {supabase.error}
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
          Wallet
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
        ) : (
          <>
            <Card className="p-6 mb-6">
              <form onSubmit={handleAddTicker} className="flex flex-col sm:flex-row gap-3">
                <Input
                  id="ticker"
                  placeholder="Adicionar ticker (ex: PETR4)"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  disabled={isSaving}
                />
                <Button type="submit" disabled={isSaving || !normalizedTicker}>
                  Cadastrar
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
                        onClick={() => handleDelete(row)}
                        aria-label={`Remover ${row.ticker}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Total: {rows.length}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
