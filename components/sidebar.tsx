"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, LogOut, MessageSquarePlus, Search, Trash2, X } from "lucide-react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Chat, GoogleProfile, User } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export function Sidebar({
  profile,
  chats,
  activeChat,
  loading,
  onSelectChat,
  onDeleteChat,
  onChatsChange,
  onSignOut,
}: {
  profile: GoogleProfile;
  chats: Chat[];
  activeChat: Chat | null;
  loading: boolean;
  onSelectChat: (chat: Chat) => void;
  onDeleteChat: (chatId: string) => Promise<void>;
  onChatsChange: () => void;
  onSignOut: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Chat | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getUsers()
      .then(setUsers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = search.trim();
    if (!q) return;
    searchTimer.current = setTimeout(() => {
      api
        .searchUsers(q)
        .then((res) => setSearchResults(res.filter((u) => u.id !== profile.id)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, profile.id]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.trim();
    setSearch(e.target.value);
    setSearching(q.length > 0);
    if (!q) setSearchResults([]);
  };

  const startChat = async (otherUser: User) => {
    try {
      const chat = await api.createChat([otherUser.id]);
      onSelectChat(chat);
      await onChatsChange();
      setSearch("");
      setSearchResults([]);
    } catch {
      // handled by caller-level toast? keep silent to avoid noise
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDeleteChat(deleteTarget.id);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const people =
    search.trim() === "" ? users : searchResults;
  const showSearchResults = search.trim() !== "";
  const myInitials = profile.username
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="flex h-full w-full flex-col border-r bg-card/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3.5">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => searchRef.current?.focus()}
            className="text-muted-foreground"
            title="New chat"
            aria-label="New chat"
          >
            <MessageSquarePlus />
          </Button>
        </div>

        {/* Search */}
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={handleSearchChange}
              placeholder="Search people…"
              className="h-9 pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {showSearchResults ? (
              <div className="flex flex-col gap-0.5">
                {searching && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!searching && people.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No people found
                  </p>
                )}
                {people.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => startChat(u)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <Avatar className="size-9">
                      {u.avatar ? <AvatarImage src={u.avatar} alt="" /> : null}
                      <AvatarFallback>
                        {(u.username || "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {u.username}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {u.email}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="px-2.5 pt-1 text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                  Chats
                </div>
                {loading ? (
                  <div className="flex flex-col gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : chats.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No conversations yet
                  </p>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectChat(chat)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectChat(chat);
                        }
                      }}
                      className={cn(
                        "group flex cursor-pointer items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-accent",
                        activeChat?.id === chat.id && "bg-accent",
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="size-10">
                          {chat.other_avatar ? (
                            <AvatarImage src={chat.other_avatar} alt="" />
                          ) : null}
                          <AvatarFallback>
                            {(chat.other_username || chat.name || "?")
                              .slice(0, 1)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background",
                            chat.other_online
                              ? "bg-emerald-400"
                              : "bg-muted-foreground/40",
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {chat.other_username ||
                              chat.name ||
                              "Direct Chat"}
                          </span>
                          {chat.last_message_at && (
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {timeAgo(chat.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {chat.last_message || "No messages yet"}
                        </div>
                      </div>
                      {!chat.is_group && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(chat);
                          }}
                          className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          title="Delete chat"
                          aria-label="Delete chat"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {!showSearchResults && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-2.5 pt-1">
                  <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                    People
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {users.filter((u) => u.id !== profile.id).length} users
                  </span>
                </div>
                {users.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No people found
                  </p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {users
                      .filter((u) => u.id !== profile.id)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => startChat(u)}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-accent"
                        >
                          <Avatar className="size-9">
                            {u.avatar ? <AvatarImage src={u.avatar} alt="" /> : null}
                            <AvatarFallback>
                              {(u.username || "?").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {u.username}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {u.email}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom user */}
        <div className="flex items-center gap-2.5 border-t p-3">
          <Avatar className="size-9">
            {profile.avatar ? (
              <AvatarImage src={profile.avatar} alt={profile.username} />
            ) : null}
            <AvatarFallback>{myInitials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{profile.username}</div>
            <div className="truncate text-xs text-muted-foreground">
              {profile.email}
            </div>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="text-muted-foreground hover:text-destructive"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut />
          </Button>
        </div>
      </div>

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete chat</DialogTitle>
            <DialogDescription>
              Delete this conversation with{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.other_username || "this person"}
              </span>
              ? This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
