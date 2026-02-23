import { supabase } from '@/lib/supabase/client';
import IndicatorsTable from '@/components/indicators-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import type { Indicator, IndicatorsCommonData } from '@/types/supabase';

export const revalidate = 0; // Revalidate data on every request

export default async function Home() {
  // Handle initialization error from client.ts
  if ('error' in supabase) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
        <div className="z-10 w-full max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-8">
            StockRadar BR
          </h1>
        </div>
        <Alert variant="destructive" className="w-full max-w-7xl mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro de Configuração</AlertTitle>
          <AlertDescription>
            Não foi possível conectar ao Supabase. Verifique suas configurações.
            <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">{supabase.error}</pre>
          </AlertDescription>
        </Alert>
         <div className="w-full max-w-7xl">
          <IndicatorsTable data={[]} commonData={null} />
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from('indicators')
    .select('id,ticker,image_mt5,data_obv,data_adx,data_insiders,data_indicators,data_peaks_valleys')
    .order('id', { ascending: false });
    
  const { data: commonData, error: commonError } = await supabase
    .from('indicators_common')
    .select('data_volume,data_magic_formula')
    .limit(1)
    .single();

  // The Supabase client might return a more generic type, so we cast it here.
  const indicators: Indicator[] = data || [];
  const indicatorsCommon: IndicatorsCommonData | null = commonData || null;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="z-10 w-full max-w-7xl">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-8">
          StockRadar BR
        </h1>
      </div>

      {error && (
        <Alert variant="destructive" className="w-full max-w-7xl mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Buscar Dados</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os indicadores do Supabase. Verifique sua conexão e as configurações do .env.
            <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">{error.message}</pre>
          </AlertDescription>
        </Alert>
      )}

      {commonError && (
         <Alert variant="destructive" className="w-full max-w-7xl mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro ao Buscar Dados Comuns</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os dados comuns da tabela 'indicators_common'.
            <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">{commonError.message}</pre>
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full max-w-7xl">
        <IndicatorsTable data={indicators} commonData={indicatorsCommon} />
      </div>
    </main>
  );
}
