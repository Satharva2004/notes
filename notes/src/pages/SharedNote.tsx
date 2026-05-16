import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Loader2, Save, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, Note } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function SharedNote() {
  const { shareName } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const editorRef = useRef<HTMLElement>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareName) return;

    const loadSharedNote = async () => {
      setLoading(true);
      try {
        const sharedNote = await api.getSharedNote(shareName);
        setNote(sharedNote);
        setTitle(sharedNote.title);
        setError("");
      } catch (err: any) {
        setError(err.message || "Shared note not found");
      } finally {
        setLoading(false);
      }
    };

    loadSharedNote();
  }, [shareName]);

  useEffect(() => {
    if (editorRef.current && note) {
      editorRef.current.innerHTML = note.content;
    }
  }, [note]);

  const canEdit = note?.permission === "editor" && Boolean(user);
  const needsLoginToEdit = note?.permission === "editor" && !user;

  const handleSave = async () => {
    if (!shareName || !note) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);
    try {
      const updatedNote = await api.updateSharedNote(shareName, {
        title: title.trim(),
        content: editorRef.current?.innerHTML ?? "",
      });
      setNote(updatedNote);
      setTitle(updatedNote.title);
      toast.success("Shared note updated");
    } catch (err: any) {
      toast.error("Could not update note", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center p-4">
        <div className="max-w-md text-center space-y-4">
          <p className="text-sm text-muted-foreground">{error || "Shared note not found"}</p>
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4 md:px-8">
          <div className="h-8 w-8 grid place-items-center rounded-md bg-primary/10 text-primary">
            <StickyNote className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">Shared note</span>
          {canEdit && (
            <Button size="sm" className="ml-auto" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 sm:mr-1.5" />
              {isSaving ? "Saving" : "Save"}
            </Button>
          )}
          {needsLoginToEdit && (
            <Button asChild size="sm" className="ml-auto">
              <Link to="/auth" state={{ from: location.pathname }}>Sign in to edit</Link>
            </Button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 md:px-8 py-10">
        {canEdit ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-none px-0 text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
          />
        ) : (
          <h1 className="text-3xl font-semibold tracking-tight">{note.title}</h1>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Updated {new Date(note.updated_at).toLocaleString()}
        </p>
        {note.edited_by && note.edited_by.length > 0 && (
          <div className="mt-4 rounded-md border border-border p-3 text-sm">
            <p className="font-medium">Edited by</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {note.edited_by.map((entry) => (
                <span key={`${entry.email}-${entry.edited_at}`} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {entry.name || entry.email}
                </span>
              ))}
            </div>
          </div>
        )}
        <article
          ref={editorRef}
          className="notes-editor mt-8 text-base leading-relaxed"
          contentEditable={canEdit}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </main>
    </div>
  );
}
