"use client";

import { useState } from "react";
import type { Indicator } from "@/types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { ImageIcon, ImageOff, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import JsonAsTable from "./json-as-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IndicatorsTableProps = {
  data: Indicator[];
};

export default function IndicatorsTable({ data }: IndicatorsTableProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<{ title: string; data: object | null } | null>(null);


  return (
    <>
      <TooltipProvider>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Ativo</TableHead>
                <TableHead>DY</TableHead>
                <TableHead>M. Liquida</TableHead>
                <TableHead>P/L Médio</TableHead>
                <TableHead>OBV</TableHead>
                <TableHead>ADX</TableHead>
                <TableHead>Insiders</TableHead>
                <TableHead>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">DM200</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>distancia da media de 200</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right w-[120px]">Imagem do Gráfico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((indicator) => {
                  const insidersQuantidade =
                    indicator.data_insiders?.items?.reduce(
                      (acc, item) => acc + item.quantidade,
                      0
                    ) ?? 0;

                  const indicatorsData = indicator.data_indicators?.items?.[0];
                  
                  const plHistoricoMedia = indicatorsData?.pl_historico?.media;
                  const pl = indicatorsData?.pl;
                  const dy = indicatorsData?.dy;
                  const mLiquida = indicatorsData?.m_liquida;


                  const plScore =
                    plHistoricoMedia != null && pl != null && plHistoricoMedia > pl ? 1 : 0;
                  
                  const dyScore = dy != null && dy > 6 ? 1 : 0;

                  const mLiquidaScore = mLiquida != null && mLiquida > 10 ? 1 : 0;

                  const score =
                    (indicator.data_obv?.trajectory === 'ascendente' ? 1 : 0) +
                    (indicator.data_adx?.values?.plus_di_signal ? 1 : 0) +
                    (insidersQuantidade > 0 ? 1 : 0) +
                    plScore +
                    dyScore +
                    mLiquidaScore;
                  
                  const scoreBreakdown = {
                      "obv_ascendente": indicator.data_obv?.trajectory === 'ascendente' ? 1 : 0,
                      "adx_positivo": indicator.data_adx?.values?.plus_di_signal ? 1 : 0,
                      "insiders_compra": insidersQuantidade > 0 ? 1 : 0,
                      "pl_descontado": plScore,
                      "dy_alto": dyScore,
                      "margem_liquida_alta": mLiquidaScore,
                      "score_total": score
                  };
                  
                  const peaksValleysData = indicator.data_peaks_valleys;
                  const signalBuy = peaksValleysData?.signal_buy;
                  const signalSell = peaksValleysData?.signal_sell;


                  return (
                    <TableRow key={indicator.id}>
                      <TableCell 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setJsonData({ title: `Dados Completos: ${indicator.ticker}`, data: indicator })}
                      >
                        <Badge variant="outline" className="font-medium">{indicator.ticker}</Badge>
                      </TableCell>
                      <TableCell
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setJsonData({ title: 'Indicadores Fundamentais (DY)', data: indicator.data_indicators })}
                      >
                        {indicatorsData?.dy ? `${indicatorsData.dy.toFixed(2)}%` : 'N/A'}
                      </TableCell>
                      <TableCell
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setJsonData({ title: 'Indicadores Fundamentais (M. Liquida)', data: indicator.data_indicators })}
                      >
                        {indicatorsData?.m_liquida != null ? `${indicatorsData.m_liquida.toFixed(2)}%` : 'N/A'}
                      </TableCell>
                      <TableCell
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setJsonData({ title: 'Indicadores Fundamentais (P/L)', data: indicator.data_indicators })}
                      >
                        <div className="flex items-center">
                          {plHistoricoMedia != null && pl != null ? (
                             plHistoricoMedia > pl ? (
                              <ArrowUp className="h-5 w-5 text-[hsl(var(--chart-2))]" />
                            ) : plHistoricoMedia < pl ? (
                              <ArrowDown className="h-5 w-5 text-destructive" />
                            ) : (
                              <Minus className="h-5 w-5 text-muted-foreground" />
                            )
                          ) : (
                            <Minus className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setJsonData({ title: 'Indicador OBV', data: indicator.data_obv })}
                      >
                        <div className="flex items-center">
                          {indicator.data_obv?.trajectory === 'ascendente' ? (
                            <ArrowUp className="h-5 w-5 text-[hsl(var(--chart-2))]" />
                          ) : indicator.data_obv?.trajectory === 'descendente' ? (
                            <ArrowDown className="h-5 w-5 text-destructive" />
                          ) : (
                            <Minus className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                         className="cursor-pointer hover:bg-muted"
                         onClick={() => setJsonData({ title: 'Indicador ADX', data: indicator.data_adx })}
                      >
                        <div className="flex items-center">
                          {indicator.data_adx?.values?.plus_di_signal ? (
                            <ArrowUp className="h-5 w-5 text-[hsl(var(--chart-2))]" />
                          ) : indicator.data_adx?.values?.minus_di_signal ? (
                            <ArrowDown className="h-5 w-5 text-destructive" />
                          ) : (
                            <Minus className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                         className="cursor-pointer hover:bg-muted"
                         onClick={() => setJsonData({ title: 'Indicador Insiders', data: indicator.data_insiders })}
                      >
                        <div className="flex items-center">
                          {insidersQuantidade > 0 ? (
                            <ArrowUp className="h-5 w-5 text-[hsl(var(--chart-2))]" />
                          ) : insidersQuantidade < 0 ? (
                            <ArrowDown className="h-5 w-5 text-destructive" />
                          ) : (
                            <Minus className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setJsonData({ title: 'Indicador DM200 (Picos e Vales)', data: indicator.data_peaks_valleys })}
                      >
                        <div className="flex items-center">
                          {signalBuy === signalSell ? (
                            <Minus className="h-5 w-5 text-muted-foreground" />
                          ) : signalBuy ? (
                            <ArrowUp className="h-5 w-5 text-[hsl(var(--chart-2))]" />
                          ) : (
                            <ArrowDown className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setJsonData({ title: `Cálculo do Score: ${indicator.ticker}`, data: scoreBreakdown })}
                      >
                        {score}
                      </TableCell>
                      <TableCell className="text-right">
                        {indicator.image_mt5 ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (indicator.image_mt5) {
                                  setSelectedImage(indicator.image_mt5.startsWith('data:image') ? indicator.image_mt5 : `data:image/png;base64,${indicator.image_mt5}`);
                              }
                            }}
                            aria-label="Ver imagem do gráfico"
                          >
                            <ImageIcon className="h-5 w-5 text-accent" />
                          </Button>
                        ) : (
                          <div className="flex justify-end items-center pr-4">
                            <ImageOff className="h-5 w-5 text-muted-foreground" aria-label="Nenhuma imagem disponível" />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    <p className="font-medium">Nenhum dado encontrado</p>
                    <p className="text-sm text-muted-foreground">
                      Verifique se sua tabela 'indicators' no Supabase contém dados.
                    </p>
                     <p className="text-sm text-muted-foreground mt-2">
                      Se houver dados, o problema pode ser a Segurança em Nível de Linha (RLS). 
                      <a href="https://supabase.com/docs/guides/auth/row-level-security" target="_blank" rel="noopener noreferrer" className="underline text-accent font-medium"> Crie uma política de acesso</a> no Supabase.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </TooltipProvider>

      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-headline">Visualização da Imagem do Gráfico</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex justify-center bg-muted/20 p-4 rounded-lg border">
            {selectedImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedImage}
                alt="Gráfico do Indicador"
                className="rounded-md shadow-lg max-w-full h-auto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!jsonData} onOpenChange={(open) => !open && setJsonData(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-headline">Dados Originais: {jsonData?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-md border bg-card">
            {jsonData ? <JsonAsTable data={jsonData.data} /> : <div className="p-4 text-center">Nenhum dado para exibir.</div>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
