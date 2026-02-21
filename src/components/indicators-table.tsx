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
import { ImageIcon, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

type IndicatorsTableProps = {
  data: Indicator[];
};

export default function IndicatorsTable({ data }: IndicatorsTableProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      // Supabase returns ISO 8601 strings, which new Date() can parse.
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Ativo</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Atualizado em</TableHead>
              <TableHead className="text-right w-[120px]">Imagem do Gráfico</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((indicator) => (
                <TableRow key={indicator.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">{indicator.ticker}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(indicator.created_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(indicator.update_at)}</TableCell>
                  <TableCell className="text-right">
                    {indicator.image_mt5 ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedImage(indicator.image_mt5)}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
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
                src={selectedImage.startsWith('data:image') ? selectedImage : `data:image/png;base64,${selectedImage}`}
                alt="Gráfico do Indicador"
                className="rounded-md shadow-lg max-w-full h-auto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
