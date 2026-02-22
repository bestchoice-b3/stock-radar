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

type NotesModalProps = {
  ticker: string | null;
  isOpen: boolean;
  onClose: () => void;
};

const USER_ID_KEY = "supabase_user_cpf";

export default function NotesModal({ ticker, isOpen, onClose }: NotesModalProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [tempCpf, setTempCpf] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for user ID in localStorage when modal is opened
    if (isOpen) {
      const storedUserId = localStorage.getItem(USER_ID_KEY);
      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        // Reset state when modal opens for a new ticker without a stored user ID
        setNotes([]);
        setError(null);
        setIsLoading(false); // No user ID, stop loading and show CPF form
      }
    }
  }, [isOpen]);

  useEffect(() => {
    // Fetch notes when userId and ticker are available and modal is open
    if (userId && ticker && isOpen) {
      fetchNotes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, ticker, isOpen]);

  async function fetchNotes() {
    if (!ticker || !userId) return;

    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("ticker", ticker)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setError(`Erro ao buscar anotações: ${error.message}`);
      console.error(error);
    } else {
      setNotes(data || []);
    }
    setIsLoading(false);
  }

  const handleCpfSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (tempCpf.trim()) {
      const formattedCpf = tempCpf.trim();
      localStorage.setItem(USER_ID_KEY, formattedCpf);
      setUserId(formattedCpf);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim() || !ticker || !userId) return;

    setIsSaving(true);
    setError(null);

    const { data: newNoteData, error: insertError } = await supabase
      .from("notes")
      .insert([{ comment: newNote, ticker: ticker, user_id: userId }])
      .select()
      .single();

    if (insertError) {
      setError(`Erro ao salvar anotação: ${insertError.message}`);
      console.error(insertError);
    } else if (newNoteData) {
      setNotes([newNoteData, ...notes]);
      setNewNote("");
    }
    setIsSaving(false);
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Anotações para {ticker}</DialogTitle>
          {!userId && (
            <DialogDescription>
              Para salvar e ver suas anotações, por favor, informe seu CPF. Ele será salvo localmente para futuras visitas.
            </DialogDescription>
          )}
        </DialogHeader>

        {!userId ? (
          <form onSubmit={handleCpfSubmit} className="grid gap-4 py-4">
            <Input
              id="cpf"
              placeholder="Digite seu CPF"
              value={tempCpf}
              onChange={(e) => setTempCpf(e.target.value)}
              required
            />
            <Button type="submit">Salvar CPF e Continuar</Button>
          </form>
        ) : (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Textarea
                  placeholder="Digite sua anotação aqui..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  disabled={isSaving}
                />
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
                      <Card key={note.id}>
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
