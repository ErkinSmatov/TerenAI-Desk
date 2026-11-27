"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createNoteAction,
  deleteNoteAction,
  updateNoteAction,
  type PatientOutcome,
} from "@/app/actions/patients";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { NoteView } from "@/lib/convexApi";
import { authorLabel } from "@/lib/patientLabels";

const MAX_LENGTH = 2000;
const PRIMARY = "h-11 rounded-full bg-[#C9F14C] px-5 font-semibold text-[#0A0D12] hover:bg-[#BBE43C]";
const DESTRUCTIVE =
  "h-11 rounded-full border border-[#B42318] bg-white px-5 font-semibold text-[#B42318] hover:bg-[#FEF3F2]";
const ICON_BUTTON = "size-11 rounded-full text-[#0A0D12]";

const dateTimeFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(ms: number): string {
  // Intl даёт «12.11.2026, 14:05»
  return dateTimeFormat.format(new Date(ms)).replace(",", "");
}

export type NotesProps = {
  patientId: string;
  notes: NoteView[];
  onNotesChange: (next: NoteView[]) => void;
  onAccessLost: () => void;
};

type Editor = { mode: "create" } | { mode: "edit"; noteId: string } | null;

export function Notes({ patientId, notes, onNotesChange, onAccessLost }: NotesProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Черновик и редактор живут только здесь: входящие notes от опроса их не затрагивают.
  const [editor, setEditor] = useState<Editor>(null);
  const [draft, setDraft] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = [...notes].sort((a, b) => b.createdAt - a.createdAt);
  const length = draft.length;
  const canSave = draft.trim().length > 0 && length <= MAX_LENGTH && !pending;

  function closeEditor() {
    setEditor(null);
    setDraft("");
  }

  // Общая обработка не-успешного результата; true, если результат обработан.
  function handleFailure<T>(result: PatientOutcome<T>): boolean {
    if ("redirect" in result) {
      router.replace(result.redirect);
      return true;
    }
    if (!result.ok) {
      if (result.kind === "not_found") onAccessLost();
      else toast.error(result.message);
      return true;
    }
    return false;
  }

  function save() {
    if (!editor || !canSave) return;
    const current = editor;
    startTransition(async () => {
      const result =
        current.mode === "create"
          ? await createNoteAction(patientId, draft)
          : await updateNoteAction(patientId, current.noteId, draft);
      if (handleFailure(result)) return;
      if (!("ok" in result) || !result.ok) return;
      const saved = result.data;
      const exists = notes.some((n) => n.noteId === saved.noteId);
      onNotesChange(
        exists ? notes.map((n) => (n.noteId === saved.noteId ? saved : n)) : [saved, ...notes],
      );
      toast.success("Заметка сохранена");
      closeEditor();
    });
  }

  function remove(noteId: string) {
    startTransition(async () => {
      const result = await deleteNoteAction(patientId, noteId);
      if (handleFailure(result)) {
        setDeleteId(null);
        return;
      }
      onNotesChange(notes.filter((n) => n.noteId !== noteId));
      toast.success("Заметка удалена");
      setDeleteId(null);
    });
  }

  function renderEditor() {
    return (
      <div className="flex flex-col gap-2">
        <Textarea
          autoFocus
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={pending}
          aria-label="Текст заметки"
          aria-invalid={length > MAX_LENGTH}
          className="min-h-[104px] bg-white"
        />
        <p
          className={`text-sm leading-[1.4] font-normal tabular-nums ${
            length > MAX_LENGTH ? "text-[#B42318]" : "text-td-ink-2"
          }`}
        >
          {length} из {MAX_LENGTH}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!canSave} onClick={save} className={PRIMARY}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Сохранить заметку
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={closeEditor}
            className="h-11 rounded-full px-5 font-semibold"
          >
            Отмена
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="flex min-h-[416px] flex-col rounded-[36px] bg-td-tile p-6 text-td-ink">
      <h2 className="text-base font-semibold">Заметки</h2>

      {editor?.mode === "create" ? <div className="mt-4">{renderEditor()}</div> : null}

      <div className="flex-1">
        {sorted.length === 0 && editor === null ? (
          <p className="mt-4 text-base leading-normal font-normal text-td-ink-2">
            Заметок пока нет. Добавьте первую, чтобы коллеги из клиники видели ваши наблюдения.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-black/10">
          {sorted.map((note) => {
            const editing = editor?.mode === "edit" && editor.noteId === note.noteId;
            return (
              <li key={note.noteId} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm leading-[1.4] font-semibold">
                      {authorLabel(note.authorName, note.isMine)}
                      <span className="font-normal text-td-ink-2">
                        {" · "}
                        {formatDateTime(note.createdAt)}
                        {note.updatedAt !== null
                          ? ` · изменено ${formatDateTime(note.updatedAt)}`
                          : ""}
                      </span>
                    </p>
                  </div>
                  {note.isMine && !editing ? (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Изменить заметку"
                        disabled={pending}
                        className={ICON_BUTTON}
                        onClick={() => {
                          setDraft(note.text);
                          setEditor({ mode: "edit", noteId: note.noteId });
                        }}
                      >
                        <Pencil aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Удалить заметку"
                        disabled={pending}
                        className={ICON_BUTTON}
                        onClick={() => setDeleteId(note.noteId)}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  ) : null}
                </div>
                {editing ? (
                  <div className="mt-2">{renderEditor()}</div>
                ) : (
                  <p className="mt-1 text-base leading-normal font-normal whitespace-pre-wrap break-words">
                    {note.text}
                  </p>
                )}
              </li>
            );
          })}
          </ul>
        )}
      </div>

      {editor === null ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDraft("");
            setEditor({ mode: "create" });
          }}
          className="mt-4 h-14 w-full rounded-[20px] border-0 bg-white px-5 font-semibold text-td-ink hover:bg-white hover:brightness-95"
        >
          <Plus aria-hidden />
          Добавить заметку
        </Button>
      ) : null}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заметку?</AlertDialogTitle>
            <AlertDialogDescription>
              Она исчезнет у всех врачей клиники, восстановить её нельзя.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className={DESTRUCTIVE}
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) remove(deleteId);
              }}
            >
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Удалить заметку
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
