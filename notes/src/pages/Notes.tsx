import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Picker } from "emoji-mart-custom";
import "emoji-mart-custom/css/emoji-mart.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Palette,
  Smile,
  Save,
  Share2,
  Plus,
  History,
  StickyNote,
  Quote,
  Code,
  Strikethrough,
  Type,
  Check,
  Sun,
  Moon,
  LogOut,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api, Note, tokenStore } from "@/lib/api";
import { socket } from "@/lib/socket";



const COLORS = ["#0a0a0b", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#a855f7", "#ec4899"];

const FONTS = [
  { label: "Geist", value: "'Geist', system-ui, sans-serif" },
  { label: "Inter", value: "'Inter', system-ui, sans-serif" },
  { label: "Playfair", value: "'Playfair Display', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', ui-monospace, monospace" },
  { label: "Caveat", value: "'Caveat', cursive" },
];

type LiveParticipant = {
  socketId: string;
  name: string;
  email: string;
};

export default function Notes() {
  const { shareName: sharedRouteName } = useParams();
  const { username: sharedRouteUsername } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const savedCaretOffsetRef = useRef(0);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const isSharedMode = Boolean(sharedRouteName);

  const [title, setTitle] = useState("Untitled note");
  const [permission, setPermission] = useState<"viewer" | "editor">("editor");
  const [autoSave, setAutoSave] = useState(true);
  const [fontFamily, setFontFamily] = useState(FONTS[0].value);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.full_name ?? "");
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [shareName, setShareName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [sharedNote, setSharedNote] = useState<Note | null>(null);
  const [shareNameEdited, setShareNameEdited] = useState(false);
  const [draftVersion, setDraftVersion] = useState(0);
  const [liveShareName, setLiveShareName] = useState("");
  const [livePeople, setLivePeople] = useState<LiveParticipant[]>([]);
  const applyingRemoteChangeRef = useRef(false);

  const formatUpdatedAt = (date: string) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));

  const saveEditorSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;
    if (document.activeElement !== editor) return;

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedSelectionRef.current = range.cloneRange();
      const prefixRange = range.cloneRange();
      prefixRange.selectNodeContents(editor);
      prefixRange.setEnd(range.endContainer, range.endOffset);
      savedCaretOffsetRef.current = prefixRange.toString().length;
    }
  };

  const findCaretPosition = (offset: number) => {
    const editor = editorRef.current;
    if (!editor) return null;

    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let remaining = offset;
    let current = walker.nextNode();

    while (current) {
      const length = current.textContent?.length ?? 0;
      if (remaining <= length) {
        return { node: current, offset: remaining };
      }
      remaining -= length;
      current = walker.nextNode();
    }

    return { node: editor, offset: editor.childNodes.length };
  };

  const restoreEditorSelection = (preferCaretOffset = false, caretOffset = savedCaretOffsetRef.current) => {
    const selection = window.getSelection();
    const range = preferCaretOffset ? document.createRange() : savedSelectionRef.current;
    if (!selection || !range) return;

    if (preferCaretOffset) {
      const caretPosition = findCaretPosition(caretOffset);
      if (!caretPosition) return;
      range.setStart(caretPosition.node, caretPosition.offset);
      range.collapse(true);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  };

  const notePreview = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return plainText || "No content yet";
  };

  const toShareName = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);

  const editorInitials = (name: string, email: string) =>
    (name || email)
      .split(/[ @._-]/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const participantColor = (value: string) => {
    const colors = ["bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"];
    const seed = value || "guest";
    return colors[seed.charCodeAt(0) % colors.length];
  };

  const loadNote = (note: Note) => {
    setCurrentNoteId(note.id);
    setTitle(note.title);
    setShareName(note.share_name || toShareName(note.title));
    setShareNameEdited(Boolean(note.share_name));
    setLiveShareName(note.share_name || "");
    if (editorRef.current) editorRef.current.innerHTML = note.content;
  };

  useEffect(() => {
    document.addEventListener("selectionchange", saveEditorSelection);
    return () => document.removeEventListener("selectionchange", saveEditorSelection);
  });

  useEffect(() => {
    if (isSharedMode || !user) return;

    const loadNotes = async () => {
      setIsLoadingNotes(true);
      try {
        const fetchedNotes = await api.getNotes();
        setNotes(fetchedNotes);
        if (fetchedNotes[0]) setTimeout(() => loadNote(fetchedNotes[0]), 0);
      } catch (error: any) {
        toast.error("Could not load notes", { description: error.message });
      } finally {
        setIsLoadingNotes(false);
      }
    };

    loadNotes();
  }, [isSharedMode, user]);

  useEffect(() => {
    if (!sharedRouteName) return;

    const loadSharedNote = async () => {
      setIsLoadingNotes(true);
      try {
        if (!sharedRouteUsername) return;
        const note = await api.getSharedNote(sharedRouteUsername, sharedRouteName);
        setSharedNote(note);
        setTitle(note.title);
        setShareName(sharedRouteName);
        setLiveShareName(sharedRouteName);
        setCurrentNoteId(note.id);
        setPermission(note.permission ?? "viewer");
        setTimeout(() => {
          if (editorRef.current) editorRef.current.innerHTML = note.content;
        }, 0);
      } catch (error: any) {
        toast.error("Could not load shared note", { description: error.message });
      } finally {
        setIsLoadingNotes(false);
      }
    };

    loadSharedNote();
  }, [sharedRouteName, sharedRouteUsername]);

  const canEdit = !isSharedMode || (permission === "editor" && Boolean(user));
  const needsLoginToEdit = isSharedMode && permission === "editor" && !user;
  const isViewOnlySharedNote = isSharedMode && permission !== "editor";
  const editedBy = sharedNote?.edited_by ?? [];

  useEffect(() => {
    const hasSocketTarget = Boolean(currentNoteId || liveShareName);
    if (!hasSocketTarget || (!sharedRouteUsername && isSharedMode)) return;

    const roomUsername = sharedRouteUsername || user?.username || sharedNote?.owner_username;
    if (!currentNoteId && !roomUsername) return;

    const handleRemoteChange = ({ title: nextTitle, content }: { title: string; content: string }) => {
      applyingRemoteChangeRef.current = true;
      setTitle(nextTitle);
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
      }
      window.setTimeout(() => {
        applyingRemoteChangeRef.current = false;
      }, 0);
    };

    const handleRemoteSave = ({ note }: { note: Note }) => {
      setSharedNote(note);
      setTitle(note.title);
      if (editorRef.current && document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = note.content;
      }
    };

    const handlePresence = ({ participants }: { participants: LiveParticipant[] }) => {
      setLivePeople(participants);
    };

    const joinRoom = () => {
      socket.emit("note:join", {
        noteId: currentNoteId,
        username: roomUsername,
        shareName: liveShareName,
        participant: {
          name: profile?.full_name || user?.email?.split("@")[0] || "Guest",
          email: user?.email || "",
        },
      });
      socket.on("note:changed", handleRemoteChange);
      socket.on("note:saved", handleRemoteSave);
      socket.on("note:presence", handlePresence);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.connect();
      socket.once("connect", joinRoom);
    }

    return () => {
      socket.emit("note:leave", { noteId: currentNoteId, username: roomUsername, shareName: liveShareName });
      socket.off("note:changed", handleRemoteChange);
      socket.off("note:saved", handleRemoteSave);
      socket.off("note:presence", handlePresence);
      socket.off("connect", joinRoom);
      setLivePeople([]);
    };
  }, [currentNoteId, isSharedMode, liveShareName, profile?.full_name, sharedRouteUsername, sharedNote?.owner_username, user?.email, user?.username]);

  useEffect(() => {
    if (!autoSave || !canEdit || draftVersion === 0 || isSaving) return;

    const timeout = window.setTimeout(() => {
      handleSave({ silent: true });
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [autoSave, canEdit, draftVersion]);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    restoreEditorSelection();
    document.execCommand(command, false, value);
    saveEditorSelection();
  };

  const insertChecklist = () => {
    editorRef.current?.focus();
    restoreEditorSelection();
    const html = `<div class="flex items-start gap-2 my-1"><input type="checkbox" class="mt-1.5 accent-primary" /><span>To-do item</span></div>`;
    document.execCommand("insertHTML", false, html);
    saveEditorSelection();
  };

  const insertEmoji = (e: string) => {
    const caretOffset = savedCaretOffsetRef.current;
    editorRef.current?.focus();
    restoreEditorSelection(true, caretOffset);
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (range) {
      range.deleteContents();
      const emojiNode = document.createTextNode(e);
      range.insertNode(emojiNode);
      range.setStartAfter(emojiNode);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      document.execCommand("insertHTML", false, e);
    }

    saveEditorSelection();
    if (canEdit) setDraftVersion((version) => version + 1);
  };

  const handleSave = async (options: { silent?: boolean } = {}) => {
    if (!canEdit) {
      toast.error("Sign in to edit this shared note");
      return null;
    }

    const content = editorRef.current?.innerHTML ?? "";

    if (!title.trim()) {
      toast.error("Title is required");
      return null;
    }

    setIsSaving(true);
    try {
      const roomUsername = sharedRouteUsername || sharedNote?.owner_username || user?.username || "";
      const savedNote = isSharedMode && sharedRouteName
        ? await api.updateSharedNote(roomUsername, sharedRouteName, { title: title.trim(), content })
        : currentNoteId
          ? await api.updateNote(currentNoteId, { title: title.trim(), content })
          : await api.createNote({ title: title.trim(), content });

      setCurrentNoteId(savedNote.id);
      if (savedNote.share_name) setLiveShareName(savedNote.share_name);
      if (isSharedMode) {
        setSharedNote(savedNote);
        if (liveShareName) {
          socket.emit("note:saved", { noteId: savedNote.id, username: roomUsername, shareName: liveShareName, note: savedNote, token: tokenStore.get() });
        }
      } else {
        setNotes((existingNotes) => [savedNote, ...existingNotes.filter((note) => note.id !== savedNote.id)]);
        if ((savedNote.id || liveShareName) && user?.username) {
          socket.emit("note:saved", { noteId: savedNote.id, username: user.username, shareName: liveShareName, note: savedNote, token: tokenStore.get() });
        }
      }
      setSavedAt("just now");
      if (!options.silent) {
        toast.success("Note saved", { description: savedNote.title });
      }
      return savedNote;
    } catch (error: any) {
      toast.error("Could not save note", { description: error.message });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (isSharedMode) return;

    const savedNote = currentNoteId ? notes.find((note) => note.id === currentNoteId) ?? (await handleSave()) : await handleSave();

    if (!savedNote) return;

    try {
      const normalizedShareName = toShareName(shareName || title);
      const response = await api.shareNote(savedNote.id, normalizedShareName, permission);
      const username = response.username || savedNote.owner_username || user?.username;
      if (!username) {
        toast.error("Could not create share URL", {
          description: "Please sign out and sign in again, then try sharing.",
        });
        return;
      }
      setShareName(normalizedShareName);
      setLiveShareName(normalizedShareName);
      const shareUrl = `${window.location.origin}/${username}/${normalizedShareName}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!", { description: shareUrl });
      } catch {
        toast.success(response.message, { description: shareUrl });
      }
    } catch (error: any) {
      if (error.message.includes("already")) {
        toast.error("That note URL already exists", {
          description: "Change the note name or type a custom share name.",
        });
      } else {
        toast.error("Could not create share link", { description: error.message });
      }
    }
  };

  const handleNew = () => {
    if (isSharedMode) return;

    setCurrentNoteId(null);
    setTitle("Untitled note");
    setShareName("");
    setShareNameEdited(false);
    setLiveShareName("");
    if (editorRef.current) editorRef.current.innerHTML = "";
    editorRef.current?.focus();
  };

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-4 md:px-6">
          <div className="flex items-center gap-2 mr-2">
            <div className="h-8 w-8 grid place-items-center rounded-md bg-primary/10 text-primary">
              <StickyNote className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight hidden sm:inline">Notes</span>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if ((currentNoteId || liveShareName) && canEdit && !applyingRemoteChangeRef.current) {
                socket.emit("note:change", {
                  noteId: currentNoteId,
                  username: sharedRouteUsername || user?.username || sharedNote?.owner_username,
                  shareName: liveShareName,
                  title: e.target.value,
                  content: editorRef.current?.innerHTML ?? "",
                  token: tokenStore.get(),
                });
              }
              if (canEdit) setDraftVersion((version) => version + 1);
              if (!shareNameEdited) {
                setShareName(toShareName(e.target.value));
              }
            }}
            disabled={!canEdit}
            className="max-w-md border-none shadow-none text-sm font-medium focus-visible:ring-0 px-2"
            placeholder="Untitled note"
          />

          <div className="ml-auto flex items-center gap-1.5">
            {livePeople.length > 0 && (
              <div className="hidden lg:flex h-9 items-center gap-2 rounded-md bg-muted/60 px-2.5">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_hsl(142_70%_40%/0.16)]" />
                  {livePeople.length} online
                </span>
                <div className="flex -space-x-1.5">
                  {livePeople.slice(0, 3).map((person) => {
                    const isSelf = person.socketId === socket.id;
                    return (
                      <Tooltip key={person.socketId}>
                        <TooltipTrigger asChild>
                          <span className={`relative grid h-6 w-6 place-items-center rounded-full ring-2 ring-background ${participantColor(person.email || person.name)} text-[9px] font-semibold text-white cursor-default select-none`}>
                            {editorInitials(person.name, person.email)}
                            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background bg-emerald-500" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="flex flex-col gap-0.5">
                          <p className="font-medium">{isSelf ? "You" : person.name || person.email || "Guest"}</p>
                          {person.email && <p className="text-xs text-muted-foreground">{person.email}</p>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {livePeople.length > 3 && (
                    <span className="grid h-6 w-6 place-items-center rounded-full ring-2 ring-background bg-background text-[9px] font-semibold text-muted-foreground">
                      +{livePeople.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {(!isSharedMode || user) && (
              <Button variant="ghost" size="sm" onClick={isSharedMode ? () => navigate("/notes") : handleNew}>
                <Plus className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">New</span>
              </Button>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">History</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>History</SheetTitle>
                  <SheetDescription>Your recently saved notes.</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-7rem)] mt-4 -mx-2 pr-2">
                  <div className="flex flex-col gap-1 px-2">
                    {isSharedMode && editedBy.length > 0 && (
                      <div className="px-3 py-2">
                        <p className="text-xs font-medium text-foreground">People with activity</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {editedBy.map((entry) => (
                            <Tooltip key={entry.email}>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                  <span className="grid h-5 w-5 place-items-center rounded-full bg-background text-[9px] font-medium text-foreground">
                                    {editorInitials(entry.name, entry.email)}
                                  </span>
                                  {entry.name || entry.email}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{entry.name || entry.email}</p>
                                <p className="text-xs text-muted-foreground">{entry.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    )}
                    {!isSharedMode && isLoadingNotes && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Loading notes...</p>
                    )}
                    {!isSharedMode && !isLoadingNotes && notes.length === 0 && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No saved notes yet.</p>
                    )}
                    {!isSharedMode && notes.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => loadNote(n)}
                        className="text-left rounded-md p-3 hover:bg-accent transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-medium text-sm truncate">{n.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{formatUpdatedAt(n.updated_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notePreview(n.content)}</p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {!isSharedMode && (
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}

            {needsLoginToEdit ? (
              <Button size="sm" asChild>
                <Link to="/auth" state={{ from: location.pathname }}>Sign in to edit</Link>
              </Button>
            ) : isViewOnlySharedNote ? (
              <Button size="sm" disabled>
                View only
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleSave()} disabled={isSaving || !canEdit}>
                <Save className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{isSaving ? "Saving" : "Save"}</span>
              </Button>
            )}

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium truncate">{profile?.full_name || "User"}</span>
                  <span className="text-xs text-muted-foreground font-normal truncate">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setDisplayName(profile?.full_name ?? ""); setEditOpen(true); }}>
                  <UserCog className="h-4 w-4 mr-2" />
                  Edit profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Formatting toolbar */}
        <div className="border-t border-border">
          <div className="flex items-center gap-1 px-2 md:px-4 py-1.5 overflow-x-auto">
            <ToggleGroup type="multiple" size="sm" className="gap-0.5">
              <ToggleGroupItem value="bold" onClick={() => exec("bold")} aria-label="Bold"><Bold className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="italic" onClick={() => exec("italic")} aria-label="Italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="underline" onClick={() => exec("underline")} aria-label="Underline"><Underline className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="strike" onClick={() => exec("strikeThrough")} aria-label="Strikethrough"><Strikethrough className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button variant="ghost" size="sm" onClick={() => exec("formatBlock", "h1")}><Heading1 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => exec("formatBlock", "h2")}><Heading2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => exec("formatBlock", "h3")}><Heading3 className="h-4 w-4" /></Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button variant="ghost" size="sm" onClick={() => exec("insertUnorderedList")}><List className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={insertChecklist}><CheckSquare className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => exec("formatBlock", "blockquote")}><Quote className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => exec("formatBlock", "pre")}><Code className="h-4 w-4" /></Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm"><Palette className="h-4 w-4" /></Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="grid grid-cols-9 gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => exec("foreColor", c)}
                      className="h-6 w-6 rounded-md border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    saveEditorSelection();
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    saveEditorSelection();
                  }}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                <Picker
                  set="apple"
                  native
                  showPreview={false}
                  emojiTooltip
                  color="#6366f1"
                  onClick={(emoji: { native?: string }, event: MouseEvent) => {
                    event.preventDefault();
                    if (emoji.native) insertEmoji(emoji.native);
                  }}
                />
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Type className="h-4 w-4" />
                  <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[90px]">
                    {FONTS.find((f) => f.value === fontFamily)?.label}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" align="start">
                {FONTS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFontFamily(f.value)}
                    style={{ fontFamily: f.value }}
                    className="w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent text-left"
                  >
                    <span className="truncate">{f.label}</span>
                    {fontFamily === f.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <div className="ml-auto flex items-center gap-2 pl-2 shrink-0">
              <Label htmlFor="autosave" className="text-xs text-muted-foreground cursor-pointer">Auto-save</Label>
              <Switch id="autosave" checked={autoSave} onCheckedChange={setAutoSave} />
              {autoSave && savedAt && (
                <span className="text-[10px] text-muted-foreground hidden lg:inline">Saved {savedAt}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 md:px-8 py-10">
          <div
            ref={editorRef}
            contentEditable={canEdit}
            suppressContentEditableWarning
            data-placeholder="Start writing your note..."
            style={{ fontFamily }}
            onFocus={saveEditorSelection}
            onMouseUp={saveEditorSelection}
            onKeyUp={saveEditorSelection}
            onBlur={saveEditorSelection}
            onInput={() => {
              if (!canEdit) return;
              saveEditorSelection();
              window.requestAnimationFrame(saveEditorSelection);
              if ((currentNoteId || liveShareName) && !applyingRemoteChangeRef.current) {
                socket.emit("note:change", {
                  noteId: currentNoteId,
                  username: sharedRouteUsername || user?.username || sharedNote?.owner_username,
                  shareName: liveShareName,
                  title,
                  content: editorRef.current?.innerHTML ?? "",
                  token: tokenStore.get(),
                });
              }
              if (!autoSave) return;
              setDraftVersion((version) => version + 1);
              setSavedAt("just now");
            }}
            className="notes-editor min-h-[60vh] outline-none text-base leading-relaxed focus:outline-none"
          />
        </div>
      </main>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update how your name appears across the app.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success("Profile updated"); setEditOpen(false); }}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
