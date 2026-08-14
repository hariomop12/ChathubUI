"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Phone,
  Send,
  Video,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageBubble } from "@/components/message";
import { api } from "@/lib/api";
import type { Attachment, Chat, Message } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_SIZE = 50 * 1024 * 1024;

function TypingIndicator({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2.5">
      <div className="flex h-8 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <span className="text-[10px] font-bold text-muted-foreground">
          ...
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-sm">
        <span className="text-xs text-muted-foreground">{text}</span>
        <span className="flex gap-1" aria-hidden>
          <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
          <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
          <span className="size-1 animate-bounce rounded-full bg-muted-foreground" />
        </span>
      </div>
    </div>
  );
}

export function ChatBox({
  chat,
  myUserId,
  messages,
  typingUsers,
  loading,
  loadingOlder,
  onLoadOlder,
  onSendMessage,
  onTyping,
  onBack,
  onAudioCall,
  onVideoCall,
  callsEnabled = true,
}: {
  chat: Chat | null;
  myUserId: string;
  messages: Message[];
  typingUsers: Record<string, string>;
  loading: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  onSendMessage: (content: string, attachment: Attachment | null) => void;
  onTyping: (isTyping: boolean) => void;
  onBack: () => void;
  onAudioCall: (chat: Chat) => void;
  onVideoCall: (chat: Chat) => void;
  callsEnabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTypingRef = useRef(onTyping);
  useEffect(() => {
    onTypingRef.current = onTyping;
  });

  // Scroll to bottom on new messages / chat change
  const lastChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (chat?.id !== lastChatIdRef.current) {
      lastChatIdRef.current = chat?.id ?? null;
      viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight });
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) return;
    const nearBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 160;
    if (nearBottom) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }
  }, [messages, chat?.id]);

  const olderLoadAnchor = useRef<number | null>(null);

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (
      viewport &&
      viewport.scrollTop < 40 &&
      !loadingOlder &&
      olderLoadAnchor.current == null
    ) {
      olderLoadAnchor.current = viewport.scrollHeight;
      onLoadOlder();
    }
  };

  // After older messages are prepended, restore the scroll position so the
  // view stays anchored (no jump / overlap while scrolling up).
  useEffect(() => {
    if (!loadingOlder && olderLoadAnchor.current != null) {
      const viewport = viewportRef.current;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight - olderLoadAnchor.current;
      }
      olderLoadAnchor.current = null;
    }
  }, [loadingOlder]);

  const sendTyping = (value: boolean) => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    onTypingRef.current(value);
    if (value) {
      typingTimeout.current = setTimeout(() => onTypingRef.current(false), 1200);
    }
  };

  const handleSubmit = () => {
    const content = input.trim();
    if ((!content && !attachment) || uploading) return;
    onTypingRef.current(false);
    onSendMessage(content, attachment);
    setInput("");
    setAttachment(null);
    setFileError("");
    textareaRef.current?.focus();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setFileError("File exceeds 50MB limit");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await api.uploadFile(file, (pct) => setUploadProgress(pct));
      setAttachment({
        url: res.url,
        name: res.name,
        type: res.type,
        size: res.size,
      });
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!chat) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border bg-card">
          <Paperclip className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Select a chat</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  const canCall =
    callsEnabled && Boolean(chat.other_user_id) && !chat.is_group;
  const typingNames = Object.values(typingUsers);
  const typingText =
    typingNames.length === 1
      ? `${typingNames[0]} is typing`
      : typingNames.length > 1
        ? `${typingNames.length} people are typing`
        : "";
  const isOwn = (id: string) => id === myUserId;
  const initials = (chat.other_username || "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
          aria-label="Back to chats"
        >
          <ArrowLeft />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="size-9">
            {chat.other_avatar ? (
              <AvatarImage src={chat.other_avatar} alt="" />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {chat.other_username || chat.name || "Direct Chat"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  chat.other_online ? "bg-emerald-400" : "bg-muted-foreground/40",
                )}
              />
              {chat.other_online ? "Online" : "Offline"}
            </div>
          </div>
        </div>
        {canCall && (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onAudioCall(chat)}
                  aria-label="Audio call"
                >
                  <Phone className="text-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Audio call</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onVideoCall(chat)}
                  aria-label="Video call"
                >
                  <Video className="text-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Video call</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
      >
        {loadingOlder && (
          <div className="flex justify-center py-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`flex items-end gap-2.5 ${
                  i % 2 === 0 ? "justify-end" : ""
                }`}
              >
                <div className="h-7 w-7 rounded-full bg-muted" />
                <div
                  className={`h-10 w-48 rounded-2xl bg-muted ${
                    i % 2 === 0 ? "rounded-br-md" : "rounded-bl-md"
                  }`}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn(msg.sender_id)}
                showAvatar
              />
            ))}
            {typingText && <TypingIndicator text={typingText} />}
          </>
        )}
      </div>

      {/* Attachment preview */}
      {(attachment || uploading) && (
        <div className="flex items-center gap-2 border-t px-4 pt-3">
          <div className="flex max-w-full items-center gap-2 rounded-lg border bg-card px-3 py-2">
            {attachment ? (
              <>
                {attachment.type.startsWith("image/") ? (
                  <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="max-w-40 truncate text-xs font-medium">
                  {attachment.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Remove attachment"
                >
                  <X className="size-3.5" />
                </button>
              </>
            ) : (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span className="text-xs text-muted-foreground">
                  Uploading… {uploadProgress}%
                </span>
              </>
            )}
          </div>
        </div>
      )}
      {fileError && (
        <div className="px-4 pt-2 text-xs text-destructive">{fileError}</div>
      )}

      {/* Input */}
      <div className="px-4 py-3">
        <div className="flex items-end gap-2 rounded-xl border bg-card p-1.5 shadow-sm focus-within:border-ring">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="shrink-0 text-muted-foreground"
            aria-label="Attach file"
          >
            <Paperclip />
          </Button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              sendTyping(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="max-h-32 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={(!input.trim() && !attachment) || uploading}
            aria-label="Send message"
          >
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
}
