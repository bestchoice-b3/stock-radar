"use client";

import { useState, useMemo } from "react";
import type { Indicator, IndicatorsCommonData } from "@/types/supabase";
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
import { ImageIcon, ImageOff, ArrowUp, ArrowDown, Minus, Star, ArrowUpDown } from "lucide-react";
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
  commonData: IndicatorsCommonData | null;
};

type SortKey = 'dy' | 'mLiquida' | 'score';
type SortDirection = 'asc' | 'desc';

export default function IndicatorsTable({ data, commonData }: IndicatorsTableProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<{ title: string; data: object | null | any[] } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }[]>([]);

  const processedAndSortedData = useMemo(() => {
    const processedData = data.map((indicator) => {
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

      const peaksValleysData = indicator.data_peaks_valleys;
      const signalBuy = peaksValleysData?.signal_buy;

      const dm200Score = signalBuy ? 2 : 0;

      const volumeData = commonData?.data_volume?.items?.[indicator.ticker];
      const isHighChangeVolume = !!(volumeData && volumeData.change > 1);
      const volumeScore = isHighChangeVolume ? 1 : 0;
      
      const isMagicFormula = !!(commonData?.data_magic_formula?.items && indicator.ticker in commonData.data_magic_formula.items);
      const magicFormulaData = commonData?.data_magic_formula?.items?.[indicator.ticker];
      const magicFormulaScore = isMagicFormula ? 1 : 0;

      const priceCurrent = indicator.data_peaks_valleys?.price_current;
      const max52Semanas = indicatorsData?.max_52_semanas;
      let upside: number | null = null;
      let upsideScore = 0;

      if (priceCurrent != null && max52Semanas != null && priceCurrent > 0) {
        upside = ((max52Semanas - priceCurrent) / priceCurrent) * 100;
        if (upside > 25) {
          upsideScore = 2;
        } else if (upside > 20) {
          upsideScore = 1;
        }
      }

      const score =
        (indicator.data_obv?.trajectory === 'ascendente' ? 1 : 0) +
        (indicator.data_adx?.values?.plus_di_signal ? 1 : 0) +
        (insidersQuantidade > 0 ? 1 : 0) +
        plScore +
        dyScore +
        mLiquidaScore + 
        dm200Score +
        volumeScore +
        magicFormulaScore +
        upsideScore;
      
      const scoreBreakdown = {
          "obv_ascendente": indicator.data_obv?.trajectory === 'ascendente' ? 1 : 0,
          "adx_positivo": indicator.data_adx?.values?.plus_di_signal ? 1 : 0,
          "insiders_compra": insidersQuantidade > 0 ? 1 : 0,
          "pl_descontado": plScore,
          "dy_alto": dyScore,
          "margem_liquida_alta": mLiquidaScore,
          "dm200_compra": dm200Score,
          "volume_change_positivo": volumeScore,
          "magic_formula": magicFormulaScore,
          "upside_potencial": upsideScore,
          "score_total": score
      };

      return {
        ...indicator,
        _calculated: {
          insidersQuantidade,
          indicatorsData,
          plHistoricoMedia,
          pl,
          dy,
          mLiquida,
          signalBuy,
          signalSell: peaksValleysData?.signal_sell,
          isHighChangeVolume,
          volumeData,
          isMagicFormula,
          magicFormulaData,
          score,
          scoreBreakdown,
          upside,
        },
      };
    });

    if (sortConfig.length === 0) {
      return processedData;
    }

    return [...processedData].sort((a, b) => {
      for (const { key, direction } of sortConfig) {
        let valA, valB;
        switch (key) {
          case 'score':
            valA = a._calculated.score;
            valB = b._calculated.score;
            break;
          case 'dy':
            valA = a._calculated.dy ?? -1;
            valB = b._calculated.dy ?? -1;
            break;
          case 'mLiquida':
            valA = a._calculated.mLiquida ?? -1;
            valB = b._calculated.mLiquida ?? -1;
            break;
          default:
            continue;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, commonData, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prevConfig => {
        const newConfig = [...prevConfig];
        const existingIndex = newConfig.findIndex(item => item.key === key);

        if (existingIndex !== -1) {
            // Key exists, toggle direction from desc -> asc, or remove if asc
            if (newConfig[existingIndex].direction === 'desc') {
                newConfig[existingIndex].direction = 'asc';
            } else {
                newConfig.splice(existingIndex, 1);
            }
        } else {
            // Key doesn't exist, add it with desc
            newConfig.push({ key, direction: 'desc' });
        }
        return newConfig;
    });
  };

  const getSortIcon = (key: SortKey) => {
    const config = sortConfig.find(item => item.key === key);
    if (!config) {
        return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground/70" />;
    }
    if (config.direction === 'desc') {
        return <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return <ArrowUp className="h-4 w-4 ml-1" />;
  };


  return (
    <>
      <TooltipProvider>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Ativo</TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('dy')} className="p-0 hover:bg-transparent font-medium">
                        DY {getSortIcon('dy')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('mLiquida')} className="p-0 hover:bg-transparent font-medium">
                        M. Liquida {getSortIcon('mLiquida')}
                    </Button>
                </TableHead>
                <TableHead>Upside</TableHead>
                <TableHead>P/L Médio</TableHead>
                <TableHead>OBV</TableHead>
                <TableHead>ADX</TableHead>
                <TableHead>Insiders</TableHead>
                 <TableHead>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Volume</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ativo com alto volume de negociação</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
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
                <TableHead>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">MF</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Magic Formula</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('score')} className="p-0 hover:bg-transparent font-medium">
                        Score {getSortIcon('score')}
                    </Button>
                </TableHead>
                <TableHead className="text-right w-[120px]">Imagem do Gráfico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedAndSortedData.length > 0 ? (
                processedAndSortedData.map((indicator) => {
                  const { 
                    insidersQuantidade,
                    plHistoricoMedia,
                    pl,
                    dy,
                    mLiquida,
                    signalBuy,
                    signalSell,
                    isHighChangeVolume,
                    volumeData,
                    isMagicFormula,
                    magicFormulaData,
                    score,
                    scoreBreakdown,
                    upside,
                   } = indicator._calculated;

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
                        {dy != null ? `${dy.toFixed(2)}%` : 'N/A'}
                      </TableCell>
                      <TableCell
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setJsonData({ title: 'Indicadores Fundamentais (M. Liquida)', data: indicator.data_indicators })}
                      >
                        {mLiquida != null ? `${mLiquida.toFixed(2)}%` : 'N/A'}
                      </TableCell>
                      <TableCell
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setJsonData({ title: `Upside: ${indicator.ticker}`, data: { "price_current": indicator.data_peaks_valleys?.price_current, "max_52_semanas": indicator.data_indicators?.items?.[0]?.max_52_semanas, "calculated_upside_%": upside?.toFixed(2) } })}
                      >
                        {upside != null ? `${upside.toFixed(2)}%` : 'N/A'}
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
                        onClick={() => setJsonData({ title: `Dados de Volume: ${indicator.ticker}`, data: volumeData || { info: "Ticker não encontrado nos dados de volume."} })}
                       >
                        <div className="flex items-center">
                          {isHighChangeVolume ? (
                            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                          ) : (
                            <Star className="h-5 w-5 text-muted-foreground" />
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
                        onClick={() => setJsonData({ title: `Dados Magic Formula: ${indicator.ticker}`, data: magicFormulaData || { info: "Ticker não encontrado na Magic Formula." } })}
                      >
                        <div className="flex items-center">
                          {isMagicFormula ? (
                            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                          ) : (
                            <Star className="h-5 w-5 text-muted-foreground" />
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
                  <TableCell colSpan={13} className="h-24 text-center">
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
