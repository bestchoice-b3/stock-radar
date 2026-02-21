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
              <TableHead className="w-[120px]">Ticker</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="text-right w-[120px]">Chart Image</TableHead>
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
                        aria-label="View chart image"
                      >
                        <ImageIcon className="h-5 w-5 text-accent" />
                      </Button>
                    ) : (
                      <div className="flex justify-end items-center pr-4">
                        <ImageOff className="h-5 w-5 text-muted-foreground" aria-label="No image available" />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No data found.
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
            <DialogTitle className="font-headline">Chart Image Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex justify-center bg-muted/20 p-4 rounded-lg border">
            {selectedImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${selectedImage}`}
                alt="Indicator Chart"
                className="rounded-md shadow-lg max-w-full h-auto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
