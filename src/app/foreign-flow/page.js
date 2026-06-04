import { supabase } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export const revalidate = 0;

const formatNumber = (value) => {
  if (value === null || value === undefined) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const monthIndex = {
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

const parsePeriodo = (periodo) => {
  if (!periodo || typeof periodo !== "string") return null;
  const m = periodo.trim().match(/^([A-Za-zÀ-ÿ]{3})\/(\d{4})$/);
  if (!m) return null;
  const mon = monthIndex[m[1]];
  const year = Number(m[2]);
  if (!mon || Number.isNaN(year)) return null;
  return year * 100 + mon;
};

const comparePeriodoDesc = (a, b) => {
  const pa = parsePeriodo(a?.periodo);
  const pb = parsePeriodo(b?.periodo);
  if (pa !== null && pb !== null) return pb - pa;
  if (pa !== null) return -1;
  if (pb !== null) return 1;
  return String(b?.periodo ?? "").localeCompare(String(a?.periodo ?? ""));
};

export default async function ForeignFlowPage() {
  if ("error" in supabase) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
        <div className="z-10 w-full max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-8">
            Foreign Flow (B3)
          </h1>
        </div>
        <Alert variant="destructive" className="w-full max-w-7xl mb-8">
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

  const { data, error } = await supabase
    .from("b3_fluxo_estrangeiro")
    .select("*")
    .order("id", { ascending: false });

  const rows = (data || [])
    .filter((row) => !(row?.periodo && String(row.periodo).includes("*")))
    .slice()
    .sort(comparePeriodoDesc);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="z-10 w-full max-w-7xl">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">
          Foreign Flow (B3)
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Monthly foreign investors flow on B3
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="w-full max-w-7xl mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Buscar Dados</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os dados da tabela 'b3_fluxo_estrangeiro'.
            <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">
              {error.message}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full max-w-7xl">
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Período</TableHead>
                <TableHead className="text-right">Compras (R$ mi)</TableHead>
                <TableHead className="text-right">Vendas (R$ mi)</TableHead>
                <TableHead className="text-right">Saldo (R$ mi)</TableHead>
                <TableHead className="text-right">Saldo Acumulado (R$ mi)</TableHead>
                <TableHead className="text-right">IPO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.periodo}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.compras)}</TableCell>
                    <TableCell className="text-right">{formatNumber(row.vendas)}</TableCell>
                    <TableCell
                      className={
                        "text-right " +
                        (Number(row.saldo) > 0
                          ? "text-[hsl(var(--chart-2))]"
                          : Number(row.saldo) < 0
                            ? "text-destructive"
                            : "")
                      }
                    >
                      {formatNumber(row.saldo)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(row.saldo_acumulado)}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(row.ipo)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="mt-4 text-sm text-muted-foreground">Total: {rows.length}</div>
      </div>
    </main>
  );
}
