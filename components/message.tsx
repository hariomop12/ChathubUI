"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatBytes } from "@/lib/utils";
import type { Message } from "@/lib/types";

function FileAttachment({
  message,
  isOwn,
  onOpen,
}: {
  message: Message;
  isOwn: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        isOwn
          ? "border-black/10 bg-black/5 hover:bg-black/10"
          : "border-border bg-background hover:bg-muted/60"
      }`}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          isOwn ? "bg-black/10" : "bg-muted"
        }`}
      >
        <FileText className={`size-5 ${isOwn ? "text-foreground" : "text-muted-foreground"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {message.file_name || "File"}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium uppercase">
            {(message.file_type || "file").split("/")[1] || "file"}
          </span>
          {formatBytes(message.file_size)}
        </div>
      </div>
    </button>
  );
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  const isImage = message.file_type?.startsWith("image/") && !!message.file_url;
  const isPdf = message.file_type === "application/pdf" && !!message.file_url;
  const isOtherFile = !!message.file_url && !isImage && !isPdf;

  const openPreview = () => {
    if (isPdf || isImage) {
      setPreview(message.file_url!);
    } else if (isOtherFile) {
      window.open(message.file_url!, "_blank", "noopener,noreferrer");
    }
  };

  const initials = (message.username || "?")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <div
        className={`flex items-end gap-2.5 ${isOwn ? "justify-end" : ""}`}
      >
        {showAvatar && !isOwn && (
          <Avatar className="size-7 shrink-0">
            {message.avatar ? (
              <AvatarImage src={message.avatar} alt={message.username} />
            ) : null}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        )}
        {isOwn && <div className="w-7 shrink-0" />}

        <div
          className={`flex max-w-[75%] flex-col gap-1 ${
            isOwn ? "items-end" : "items-start"
          }`}
        >
          {!isOwn && showAvatar && (
            <span className="px-1 text-[11px] text-muted-foreground">
              {message.username}
            </span>
          )}

          <div
            className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "border border-border bg-card text-card-foreground rounded-bl-md"
            }`}
          >
            {message.file_url && isImage && (
              <button
                type="button"
                onClick={openPreview}
                className="mb-2 block cursor-zoom-in overflow-hidden rounded-lg"
              >
                <img
                  src={message.file_url}
                  alt={message.file_name || "Image"}
                  className="max-h-64 w-auto max-w-full object-cover"
                />
              </button>
            )}

            {message.file_url && (isPdf || isOtherFile) && (
              <div className="mb-2 min-w-44">
                <FileAttachment
                  message={message}
                  isOwn={isOwn}
                  onOpen={openPreview}
                />
              </div>
            )}

            {message.content && (
              <p className="break-words whitespace-pre-wrap text-[13.5px] leading-relaxed">
                {message.content}
              </p>
            )}
          </div>

          <span
            className={`px-1 text-[10px] text-muted-foreground ${
              isOwn ? "text-right" : ""
            }`}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent
          showCloseButton={false}
          className="border-transparent bg-transparent p-0 shadow-none sm:max-w-[90vw]"
        >
          {isPdf ? (
            <iframe
              src={preview ?? undefined}
              title="PDF Preview"
              className="h-[85vh] w-[90vw] rounded-xl border border-border bg-white"
            />
          ) : (
            <img
              src={preview ?? undefined}
              alt="Preview"
              className="mx-auto max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
            />
          )}
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
            aria-label="Close preview"
          >
            <X className="size-4" />
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
