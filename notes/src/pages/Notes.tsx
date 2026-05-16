import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
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
  Link2,
  Copy,
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

type NoteHistoryItem = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
};

const SAMPLE_HISTORY: NoteHistoryItem[] = [
  { id: "1", title: "Product roadmap Q3", preview: "Goals, milestones and key bets for the quarter...", updatedAt: "2h ago" },
  { id: "2", title: "Meeting notes — design sync", preview: "Discussed new editor toolbar, share flow...", updatedAt: "Yesterday" },
  { id: "3", title: "Reading list", preview: "Books, essays and papers to read this month...", updatedAt: "3 days ago" },
  { id: "4", title: "Trip to Lisbon", preview: "Flights, places, restaurants and pastel de nata...", updatedAt: "Last week" },
];

const COLORS = ["#0a0a0b", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#a855f7", "#ec4899"];

const FONTS = [
  { label: "Geist", value: "'Geist', system-ui, sans-serif" },
  { label: "Inter", value: "'Inter', system-ui, sans-serif" },
  { label: "Playfair", value: "'Playfair Display', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', ui-monospace, monospace" },
  { label: "Caveat", value: "'Caveat', cursive" },
];

export default function Notes() {
  const editorRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, profile, signOut } = useAuth();

  const [title, setTitle] = useState("Untitled note");
  const [permission, setPermission] = useState<"viewer" | "editor">("editor");
  const [autoSave, setAutoSave] = useState(true);
  const [fontFamily, setFontFamily] = useState(FONTS[0].value);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.full_name ?? "");

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const insertChecklist = () => {
    editorRef.current?.focus();
    const html = `<div class="flex items-start gap-2 my-1"><input type="checkbox" class="mt-1.5 accent-primary" /><span>To-do item</span></div>`;
    document.execCommand("insertHTML", false, html);
  };

  const insertEmoji = (e: string) => {
    editorRef.current?.focus();
    document.execCommand("insertText", false, e);
  };

  const handleSave = () => toast.success("Note saved", { description: title });
  const shareUrl = `${window.location.origin}/notes/shared/abc123`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied");
  };
  const handleNew = () => {
    setTitle("Untitled note");
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
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-md border-none shadow-none text-sm font-medium focus-visible:ring-0 px-2"
            placeholder="Untitled note"
          />

          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleNew}>
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New</span>
            </Button>

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
                    {SAMPLE_HISTORY.map((n) => (
                      <button
                        key={n.id}
                        className="text-left rounded-md p-3 hover:bg-accent transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-medium text-sm truncate">{n.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{n.updatedAt}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.preview}</p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share this note</DialogTitle>
                  <DialogDescription>Anyone with the link can access this note.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                    <div className="space-y-0.5 min-w-0">
                      <Label className="text-sm">Permission</Label>
                      <p className="text-xs text-muted-foreground truncate">
                        {permission === "editor" ? "Recipients can view and edit" : "Recipients can view only"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">View</span>
                      <Switch
                        checked={permission === "editor"}
                        onCheckedChange={(c) => setPermission(c ? "editor" : "viewer")}
                      />
                      <span className="text-xs text-muted-foreground">Edit</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm bg-muted/40">
                      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate text-muted-foreground">{shareUrl}</span>
                    </div>
                    <Button onClick={handleCopyLink} size="sm" className="shrink-0">
                      <Copy className="h-4 w-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setShareOpen(false)}>Done</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Save</span>
            </Button>

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
                <Button variant="ghost" size="sm"><Smile className="h-4 w-4" /></Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                <Picker
                  data={data}
                  set="apple"
                  theme={resolvedTheme === "dark" ? "dark" : "light"}
                  previewPosition="none"
                  skinTonePosition="search"
                  onEmojiSelect={(e: { native: string }) => insertEmoji(e.native)}
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
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Start writing your note..."
            style={{ fontFamily }}
            onInput={() => {
              if (!autoSave) return;
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
