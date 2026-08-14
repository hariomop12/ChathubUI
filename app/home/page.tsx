"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { RequireAuth } from "@/components/require-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { clearGoogleToken, getGoogleProfile } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Chat } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

function HomeInner() {
  const router = useRouter();
  const profile = getGoogleProfile()!;
  const [chats, setChats] = useState<Chat[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.getChats(), api.getUsers()]).then(
      ([chatsRes, usersRes]) => {
        if (chatsRes.status === "fulfilled") setChats(chatsRes.value);
        if (usersRes.status === "fulfilled")
          setOnlineCount(
            usersRes.value.filter((u) => u.id !== profile.id).length,
          );
        setLoading(false);
      },
    );
  }, [profile.id]);

  const signOut = () => {
    clearGoogleToken();
    router.replace("/");
  };

  const recentChats = chats.slice(0, 4);
  const initials = profile.username
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 40% at 50% -10%, rgba(255,255,255,0.06), transparent)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between border-b px-6 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer rounded-full ring-ring transition-shadow focus-visible:ring-2 focus-visible:outline-none">
                <Avatar className="size-8">
                  <AvatarImage src={profile.avatar} alt={profile.username} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="font-medium">{profile.username}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {profile.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} variant="destructive">
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
        <div className="animate-slide-up flex flex-col items-center text-center">
          <div className="mb-6 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            Welcome back
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Hello,{" "}
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {profile.username.split(" ")[0]}
            </span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your conversations are right here.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-3">
          {[
            {
              label: "Chats",
              value: loading ? null : String(chats.length),
              icon: MessageCircle,
            },
            {
              label: "Online",
              value: loading ? null : String(onlineCount),
              icon: Users,
            },
            {
              label: "Encrypted",
              value: "E2E",
              icon: ShieldCheck,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-2 rounded-lg border bg-card/60 py-5 backdrop-blur"
            >
              <s.icon className="size-4 text-muted-foreground" />
              {s.value === null ? (
                <Skeleton className="h-6 w-8" />
              ) : (
                <span className="text-2xl font-semibold">{s.value}</span>
              )}
              <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : recentChats.length > 0 ? (
            <>
              <div className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Recent chats
              </div>
              {recentChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => router.push(`/chat?id=${chat.id}`)}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg border bg-card/60 p-3 text-left transition-colors hover:bg-card"
                >
                  <Avatar className="size-10">
                    {chat.other_avatar ? (
                      <AvatarImage src={chat.other_avatar} alt="" />
                    ) : null}
                    <AvatarFallback>
                      {(chat.other_username || "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {chat.other_username || chat.name || "Direct Chat"}
                    </div>
                    {chat.last_message && (
                      <div className="truncate text-xs text-muted-foreground">
                        {chat.last_message}
                      </div>
                    )}
                  </div>
                  {chat.last_message_at && (
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(chat.last_message_at)}
                    </span>
                  )}
                </button>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
              <MessageCircle className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No chats yet. Start a conversation.
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-10">
          <Button
            onClick={() => router.push("/chat")}
            size="lg"
            className="h-11 w-full"
          >
            Open Chats <ArrowRight />
          </Button>
          <Button
            onClick={() => router.push("/chat")}
            variant="secondary"
            size="lg"
            className="h-11 w-full"
          >
            <Plus /> New Chat
          </Button>
          {loading ? (
            <div className="flex justify-center pt-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <RequireAuth>
      <HomeInner />
    </RequireAuth>
  );
}
