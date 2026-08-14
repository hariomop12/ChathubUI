"use client";

import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { CallState, CallerInfo } from "@/lib/types";

export function CallModal({
  callState,
  callerInfo,
  isVideo,
  localStream,
  remoteStream,
  onAnswer,
  onReject,
  onEndCall,
  onCancelCall,
}: {
  callState: CallState;
  callerInfo: CallerInfo | null;
  isVideo: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAnswer: () => void;
  onReject: () => void;
  onEndCall: () => void;
  onCancelCall: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const open = callState !== "idle";
  if (!open) return null;

  const label =
    callState === "incoming"
      ? isVideo
        ? "Incoming video call"
        : "Incoming audio call"
      : callState === "calling"
        ? "Calling…"
        : callState === "connected"
          ? isVideo
            ? "Video call"
            : "Audio call"
          : "";

  const initials = (callerInfo?.username || "?")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const showVideoArea = callState === "connected" && isVideo && remoteStream;

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="flex h-dvh max-h-none w-screen max-w-none items-center justify-center rounded-none border-none bg-black p-0 sm:max-w-none"
      >
        {/* Subtle glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,255,255,0.05), transparent)",
          }}
        />

        <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6 px-6 text-center">
          {/* Remote video */}
          {showVideoArea ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10">
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              {localStream && (
                <video
                  ref={localRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute right-3 bottom-3 h-1/4 w-auto rounded-lg border border-white/20 object-cover"
                />
              )}
            </div>
          ) : (
            <Avatar className="size-24 border-2 border-white/10">
              {callerInfo?.avatar ? (
                <AvatarImage
                  src={callerInfo.avatar}
                  alt={callerInfo?.username || ""}
                  className="size-full"
                />
              ) : null}
              <AvatarFallback className="bg-white/5 text-3xl font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-white">
              {callerInfo?.username || "Unknown"}
            </h2>
            <p className="text-sm text-white/50">{label}</p>
          </div>

          {/* Audio pulse */}
          {callState === "connected" && !isVideo && (
            <div className="flex items-end justify-center gap-1.5" aria-hidden>
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 animate-pulse rounded-full bg-white/40"
                  style={{
                    height: 16 + ((i * 7) % 20),
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="mt-2 flex items-center gap-6">
            {callState === "incoming" && (
              <>
                <button
                  type="button"
                  onClick={onReject}
                  className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-105 active:scale-95"
                  aria-label="Reject call"
                >
                  <PhoneOff className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={onAnswer}
                  className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-emerald-500 text-white transition-transform hover:scale-105 active:scale-95"
                  aria-label="Answer call"
                >
                  {isVideo ? <Video className="size-6" /> : <Phone className="size-6" />}
                </button>
              </>
            )}

            {callState === "calling" && (
              <button
                type="button"
                onClick={onCancelCall}
                className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-105 active:scale-95"
                aria-label="Cancel call"
              >
                <PhoneOff className="size-6" />
              </button>
            )}

            {callState === "connected" && (
              <button
                type="button"
                onClick={onEndCall}
                className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-105 active:scale-95"
                aria-label="End call"
              >
                <PhoneOff className="size-6" />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
