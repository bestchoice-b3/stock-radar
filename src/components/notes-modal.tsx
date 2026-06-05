"use client";

import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Note } from "@/types/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type NotesModalProps = {
  ticker: string | null;
  isOpen: boolean;
  onClose: () => void;
};

const USER_ID_KEY = "supabase_user_email";

export default function NotesModal({ ticker, isOpen, onClose }: NotesModalProps) {
  const sb = "error" in supabase ? null : supabase;
  const configError = "error" in supabase ? supabase.error : null;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [importance, setImportance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const storedUserEmail = localStorage.getItem(USER_ID_KEY);
      if (storedUserEmail) {
        setUserEmail(storedUserEmail);
      } else {
        setNotes([]);
        setError(null);
        setIsLoading(false);
      }
    } else {
        setNewNote("");
        setImportance(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (userEmail && ticker && isOpen) {
      fetchNotes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, ticker, isOpen]);

  async function fetchNotes() {
    if (!ticker || !userEmail) return;
    if (!sb) {
      setError("Não foi possível conectar ao Supabase. Verifique suas configurações.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error } = await sb
      .from("notes")
      .select("*")
      .eq("ticker", ticker)
      .eq("user_id", userEmail)
      .order("created_at", { ascending: false });

    if (error) {
      setError(`Erro ao buscar anotações: ${error.message}`);
      console.error(error);
    } else {
      setNotes(data || []);
    }
    setIsLoading(false);
  }

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (tempEmail.trim()) {
      const formattedEmail = tempEmail.trim();
      localStorage.setItem(USER_ID_KEY, formattedEmail);
      setUserEmail(formattedEmail);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim() || !ticker || !userEmail) return;
    if (!sb) {
      setError("Não foi possível conectar ao Supabase. Verifique suas configurações.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const { data: newNoteData, error: insertError } = await sb
      .from("notes")
      .insert([{ comment: newNote, ticker: ticker, user_id: userEmail, importance: importance }])
      .select()
      .single();

    if (insertError) {
      setError(`Erro ao salvar anotação: ${insertError.message}`);
      console.error(insertError);
    } else if (newNoteData) {
      setNotes([newNoteData, ...notes]);
      setNewNote("");
      setImportance(0);
    }
    setIsSaving(false);
  };
  
  if (!isOpen) {
    return null;
  }

  const importanceClasses = {
    0: "", // Normal
    1: "bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800/30", // Alerta
    2: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/30", // Urgente
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Anotações para {ticker}</DialogTitle>
          {!userEmail && (
            <DialogDescription>
              Para salvar e ver suas anotações, por favor, informe seu e-mail. Ele será salvo localmente para futuras visitas.
            </DialogDescription>
          )}
        </DialogHeader>

        {!userEmail ? (
          <form onSubmit={handleEmailSubmit} className="grid gap-4 py-4">
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
        ) : (
          <>
            {configError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Não foi possível conectar ao Supabase. Verifique suas configurações.
                  <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-code">
                    {configError}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid gap-4">
                <Textarea
                  placeholder="Digite sua anotação aqui..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value.toUpperCase())}
                  rows={3}
                  disabled={isSaving}
                />
                
                <div className="space-y-2">
                    <Label>Importância</Label>
                    <RadioGroup 
                        value={String(importance)} 
                        onValueChange={(value) => setImportance(Number(value))}
                        className="flex items-center space-x-4"
                        disabled={isSaving}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="0" id="r-normal" />
                            <Label htmlFor="r-normal" className="font-normal">Normal</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="r-alerta" />
                            <Label htmlFor="r-alerta" className="font-normal">Alerta</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2" id="r-urgente" />
                            <Label htmlFor="r-urgente" className="font-normal">Urgente</Label>
                        </div>
                    </RadioGroup>
                </div>

                <Button onClick={handleSaveNote} disabled={!newNote.trim() || isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Anotação
                </Button>
              </div>

              <h3 className="font-medium mt-4 border-b pb-2">Anotações Salvas</h3>
              
              <ScrollArea className="h-64 pr-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : notes.length > 0 ? (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <Card key={note.id} className={cn(importanceClasses[note.importance as keyof typeof importanceClasses])}>
                        <CardContent className="pt-6">
                          <p className="text-sm whitespace-pre-wrap">{note.comment}</p>
                        </CardContent>
                        <CardFooter>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Nenhuma anotação encontrada para este ativo.
                  </div>
                )}
              </ScrollArea>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
