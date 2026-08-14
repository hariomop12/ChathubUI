"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Peer, { MediaConnection } from "peerjs";
import { toast } from "sonner";

import { CallModal } from "@/components/call-modal";
import { ChatBox } from "@/components/chat-box";
import { Sidebar } from "@/components/sidebar";
import { api } from "@/lib/api";
import { clearGoogleToken, getGoogleProfile } from "@/lib/auth";
import { getSocket } from "@/lib/socket";
import type {
  Attachment,
  CallState,
  CallerInfo,
  Chat,
  GoogleProfile,
  Message,
} from "@/lib/types";

const PEER_HOST = process.env.NEXT_PUBLIC_PEER_HOST || "";
const PEER_PORT = Number(process.env.NEXT_PUBLIC_PEER_PORT || "0") || undefined;
const PEER_PATH = process.env.NEXT_PUBLIC_PEER_PATH || "/peerjs";
const PEER_SECURE = process.env.NEXT_PUBLIC_PEER_SECURE === "true";
const CALLS_ENABLED = !!PEER_HOST;

interface RealtimeRef {
  activeChatId: string | null;
  callState: CallState;
  callerInfo: CallerInfo | null;
  isVideo: boolean;
  pendingTarget: string | null;
  peerCall: MediaConnection | null;
  localStream: MediaStream | null;
  peerId: string;
}

function ChatClient({ profile }: { profile: GoogleProfile }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlChatId = searchParams.get("id");

  const [chats, setChats] = useState<Chat[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<
    Record<string, Record<string, string>>
  >({});
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [callState, setCallState] = useState<CallState>("idle");
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socket = useMemo(() => getSocket(), []);
  const stateRef = useRef<RealtimeRef>({
    activeChatId: null,
    callState: "idle",
    callerInfo: null,
    isVideo: false,
    pendingTarget: null,
    peerCall: null,
    localStream: null,
    peerId: "",
  });
  useEffect(() => {
    stateRef.current.activeChatId = activeChatId;
    stateRef.current.callState = callState;
    stateRef.current.callerInfo = callerInfo;
    stateRef.current.isVideo = isVideo;
  }, [activeChatId, callState, callerInfo, isVideo]);

  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ----- call helpers -----

  const resetCall = useCallback(() => {
    stateRef.current.localStream?.getTracks().forEach((t) => t.stop());
    stateRef.current.peerCall?.close();
    stateRef.current.localStream = null;
    stateRef.current.peerCall = null;
    stateRef.current.pendingTarget = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallerInfo(null);
    setCallState("idle");
  }, []);

  const getUserMedia = useCallback(async (video: boolean) => {
    return navigator.mediaDevices.getUserMedia({ video, audio: true });
  }, []);

  const peerEnabled = useRef(false);
  useEffect(() => {
    peerEnabled.current = CALLS_ENABLED;
  }, []);

  const peerRef = useRef<Peer | null>(null);

  // ----- socket lifecycle -----

  useEffect(() => {
    const offs: Array<() => void> = [];

    offs.push(
      socket.on("connect", () => {
        socket.emit("register-user", { userId: profile.id });
        if (stateRef.current.peerId) {
          socket.emit("register-peer", {
            userId: profile.id,
            peerId: stateRef.current.peerId,
          });
        }
        const chatId = stateRef.current.activeChatId;
        if (chatId) {
          socket.emit("join-room", { chatId });
          api
            .getMessages(chatId)
            .then((page) => {
              if (stateRef.current.activeChatId !== chatId) return;
              setMessages([...page.messages].sort((a, b) => a.seq - b.seq));
              setNextCursor(page.nextCursor ?? null);
            })
            .catch(() => {});
        }
      }),
    );

    offs.push(
      socket.on("disconnect", () => {
        setTypingUsers({});
      }),
    );

    offs.push(
      socket.on("receive-message", (data) => {
        const msg = data as Message;
        if (msg.chat_id === stateRef.current.activeChatId) {
          setMessages((prev) => {
            if (
              prev.some(
                (m) =>
                  m.id === msg.id ||
                  (m.client_message_id &&
                    msg.client_message_id &&
                    m.client_message_id === msg.client_message_id),
              )
            ) {
              return prev;
            }
            return [...prev, msg];
          });
          setTypingUsers((prev) => {
            if (!prev[msg.chat_id]?.[msg.sender_id]) return prev;
            const next = { ...prev, [msg.chat_id]: { ...prev[msg.chat_id] } };
            delete next[msg.chat_id][msg.sender_id];
            return next;
          });
        }
        setChats((prev) =>
          prev.map((c) =>
            c.id === msg.chat_id
              ? {
                  ...c,
                  last_message: msg.file_name
                    ? `📎 ${msg.file_name}`
                    : msg.content || "Attachment",
                  last_message_at: msg.created_at,
                }
              : c,
          ),
        );
      }),
    );

    offs.push(
      socket.on("user-typing", (data) => {
        const { chatId, userId, username } = data as {
          chatId: string;
          userId: string;
          username: string;
        };
        if (chatId !== stateRef.current.activeChatId || userId === profile.id) {
          return;
        }
        const timerKey = `${chatId}:${userId}`;
        if (typingTimers.current[timerKey]) {
          clearTimeout(typingTimers.current[timerKey]);
        }
        setTypingUsers((prev) => {
          const chatTyping = prev[chatId] ?? {};
          if (chatTyping[userId] === username) return prev;
          return { ...prev, [chatId]: { ...chatTyping, [userId]: username } };
        });
        typingTimers.current[timerKey] = setTimeout(() => {
          setTypingUsers((prev) => {
            if (!prev[chatId]?.[userId]) return prev;
            const next = { ...prev, [chatId]: { ...prev[chatId] } };
            delete next[chatId][userId];
            return next;
          });
        }, 3000);
      }),
    );

    offs.push(
      socket.on("user-stop-typing", (data) => {
        const { chatId, userId } = data as { chatId: string; userId: string };
        const timerKey = `${chatId}:${userId}`;
        if (typingTimers.current[timerKey]) {
          clearTimeout(typingTimers.current[timerKey]);
        }
        setTypingUsers((prev) => {
          if (!prev[chatId]?.[userId]) return prev;
          const next = { ...prev, [chatId]: { ...prev[chatId] } };
          delete next[chatId][userId];
          return next;
        });
      }),
    );

    offs.push(
      socket.on("user-presence", (data) => {
        const { userId, online } = data as { userId: string; online: boolean };
        setPresence((prev) =>
          prev[userId] === online ? prev : { ...prev, [userId]: online },
        );
      }),
    );

    offs.push(
      socket.on("peer-id-response", (data) => {
        const { peerId } = data as { peerId: string };
        const { pendingTarget, localStream: stream, callState: cs } =
          stateRef.current;
        if (cs !== "calling" || !pendingTarget || !peerRef.current) return;
        if (!peerId) {
          toast.error("User is offline");
          resetCall();
          return;
        }
        const conn = peerRef.current.call(peerId, stream!);
        stateRef.current.peerCall = conn;
        conn.on("stream", (remote) => {
          setRemoteStream(remote);
          setCallState("connected");
        });
        conn.on("error", () => resetCall());
        conn.on("close", () => resetCall());
        socket.emit("call-user", {
          targetUserId: pendingTarget,
          callerId: profile.id,
          callerUsername: profile.username,
          callerAvatar: profile.avatar,
          isVideo: stateRef.current.isVideo,
        });
      }),
    );

    offs.push(
      socket.on("incoming-call", (data) => {
        const d = data as {
          callerId: string;
          callerUsername: string;
          callerAvatar: string;
          isVideo: boolean;
        };
        if (stateRef.current.callState !== "idle") return;
        setCallerInfo({
          callerId: d.callerId,
          username: d.callerUsername,
          avatar: d.callerAvatar,
        });
        setIsVideo(!!d.isVideo);
        setCallState("incoming");
      }),
    );

    offs.push(
      socket.on("call-rejected", () => {
        toast.info("Call declined");
        resetCall();
      }),
    );

    offs.push(
      socket.on("call-ended", () => {
        toast.info("Call ended");
        resetCall();
      }),
    );

    offs.push(
      socket.on("user-busy", () => {
        toast.info("User is busy");
        resetCall();
      }),
    );

    socket.connect();

    return () => {
      offs.forEach((o) => o());
      socket.disconnect();
      peerRef.current?.destroy();
    };
  }, [socket, profile.id, profile.username, profile.avatar, resetCall]);

  // ----- peer lifecycle -----

  useEffect(() => {
    if (!CALLS_ENABLED) return;
    const pid = crypto.randomUUID();
    const peer = new Peer(pid, {
      host: PEER_HOST,
      port: PEER_PORT,
      path: PEER_PATH,
      secure: PEER_SECURE,
    });
    peerRef.current = peer;
    peer.on("open", (id) => {
      stateRef.current.peerId = id;
      if (socket.connected) {
        socket.emit("register-peer", { userId: profile.id, peerId: id });
      }
    });
    peer.on("call", (incoming) => {
      stateRef.current.peerCall = incoming;
      incoming.on("stream", (remote) => setRemoteStream(remote));
      incoming.on("error", () => resetCall());
      incoming.on("close", () => resetCall());
    });
    peer.on("error", () => {});
    return () => {
      peer.destroy();
    };
  }, [socket, profile.id, resetCall]);

  // ----- chats -----

  const refreshChats = useCallback(async () => {
    try {
      const cs = await api.getChats();
      setChats(cs);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setChatLoading(true);
    api
      .getChats()
      .then((cs) => {
        if (!cancelled) setChats(cs);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChatLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ----- active chat from URL -----

  useEffect(() => {
    if (!urlChatId) {
      if (activeChatId) setActiveChatId(null);
      return;
    }
    if (activeChatId === urlChatId) return;
    setActiveChatId(urlChatId);
    if (!chats.some((c) => c.id === urlChatId)) {
      api
        .getChatById(urlChatId)
        .then((c) =>
          setChats((prev) =>
            prev.some((x) => x.id === c.id) ? prev : [c, ...prev],
          ),
        )
        .catch(() => {
          setActiveChatId(null);
          router.replace("/chat");
        });
    }
  }, [urlChatId, activeChatId, chats, router]);

  // ----- messages for active chat -----

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setNextCursor(null);
      return;
    }
    let cancelled = false;
    setMessageLoading(true);
    setOlderLoading(false);
    api
      .getMessages(activeChatId)
      .then((page) => {
        if (cancelled) return;
        setMessages([...page.messages].sort((a, b) => a.seq - b.seq));
        setNextCursor(page.nextCursor ?? null);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load chat");
      })
      .finally(() => {
        if (!cancelled) setMessageLoading(false);
      });
    socket.emit("join-room", { chatId: activeChatId });
    return () => {
      cancelled = true;
      socket.emit("leave-room", { chatId: activeChatId });
    };
  }, [activeChatId, socket]);

  // ----- handlers -----

  const selectChat = useCallback(
    (chat: Chat) => {
      setActiveChatId(chat.id);
      router.replace(`/chat?id=${chat.id}`, { scroll: false });
    },
    [router],
  );

  const loadOlder = useCallback(async () => {
    if (!activeChatId || olderLoading || nextCursor == null) return;
    setOlderLoading(true);
    try {
      const page = await api.getMessages(activeChatId, nextCursor);
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const older = [...page.messages].reverse().filter((m) => !seen.has(m.id));
        return [...older, ...prev];
      });
      setNextCursor(page.nextCursor ?? null);
    } catch {
      // keep existing messages
    } finally {
      setOlderLoading(false);
    }
  }, [activeChatId, nextCursor, olderLoading]);

  const sendMessage = useCallback(
    async (chatId: string, content: string, attachment: Attachment | null) => {
      const clientMessageId = crypto.randomUUID();
      const optimistic: Message = {
        id: `temp-${clientMessageId}`,
        chat_id: chatId,
        sender_id: profile.id,
        content,
        seq: 0,
        client_message_id: clientMessageId,
        file_url: attachment?.url ?? null,
        file_name: attachment?.name ?? null,
        file_type: attachment?.type ?? null,
        file_size: attachment?.size ?? null,
        created_at: new Date().toISOString(),
        username: profile.username,
        avatar: profile.avatar,
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const saved = await api.sendMessage(chatId, {
          content,
          clientMessageId,
          fileUrl: attachment?.url,
          fileName: attachment?.name,
          fileType: attachment?.type,
          fileSize: attachment?.size,
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? saved : m)),
        );
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  last_message: saved.file_name
                    ? `📎 ${saved.file_name}`
                    : saved.content || "Attachment",
                  last_message_at: saved.created_at,
                }
              : c,
          ),
        );
      } catch (err) {
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimistic.id),
        );
        toast.error(err instanceof Error ? err.message : "Failed to send");
      }
    },
    [profile.id, profile.username, profile.avatar],
  );

  const handleTyping = useCallback(
    (chatId: string, typing: boolean) => {
      if (typing) {
        socket.emit("typing", {
          chatId,
          userId: profile.id,
          username: profile.username,
        });
      } else {
        socket.emit("stop-typing", { chatId, userId: profile.id });
      }
    },
    [socket, profile.id, profile.username],
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        await api.deleteChat(chatId);
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (activeChatId === chatId) {
          setActiveChatId(null);
          router.replace("/chat");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete chat");
      }
    },
    [activeChatId, router],
  );

  const signOut = useCallback(() => {
    clearGoogleToken();
    socket.disconnect();
    router.replace("/");
  }, [socket, router]);

  // ----- call actions -----

  const startCall = useCallback(
    async (chat: Chat, video: boolean) => {
      if (stateRef.current.callState !== "idle") return;
      const target = chat.other_user_id;
      if (!target || !peerRef.current) return;
      let stream: MediaStream;
      try {
        stream = await getUserMedia(video);
      } catch {
        toast.error("Could not access camera/microphone");
        return;
      }
      stateRef.current.localStream = stream;
      stateRef.current.pendingTarget = target;
      setLocalStream(stream);
      setIsVideo(video);
      setCallerInfo({
        username: profile.username,
        avatar: profile.avatar,
      });
      setCallState("calling");
      socket.emit("get-peer-id", { targetUserId: target });
    },
    [socket, getUserMedia, profile.username, profile.avatar],
  );

  const answerCall = useCallback(async () => {
    const incoming = stateRef.current.peerCall;
    const callee = stateRef.current.callerInfo;
    if (!incoming || !callee?.callerId) return;
    let stream: MediaStream;
    try {
      stream = await getUserMedia(stateRef.current.isVideo);
    } catch {
      toast.error("Could not access camera/microphone");
      return;
    }
    incoming.answer(stream);
    stateRef.current.localStream = stream;
    setLocalStream(stream);
    setCallState("connected");
    socket.emit("call-answered", { targetUserId: callee.callerId });
  }, [socket, getUserMedia]);

  const rejectCall = useCallback(() => {
    socket.emit("call-rejected", {
      targetUserId: stateRef.current.callerInfo?.callerId,
    });
    resetCall();
  }, [socket, resetCall]);

  const cancelCall = useCallback(() => {
    socket.emit("call-rejected", { targetUserId: stateRef.current.pendingTarget });
    resetCall();
  }, [socket, resetCall]);

  const endCall = useCallback(() => {
    const target =
      stateRef.current.pendingTarget || stateRef.current.callerInfo?.callerId;
    if (target) socket.emit("end-call", { targetUserId: target });
    resetCall();
  }, [socket, resetCall]);

  const displayChats = useMemo(
    () =>
      chats.map((c) =>
        c.other_user_id
          ? { ...c, other_online: !!presence[c.other_user_id] }
          : c,
      ),
    [chats, presence],
  );

  const sortedChats = useMemo(
    () =>
      [...displayChats].sort(
        (a, b) =>
          new Date(b.last_message_at || b.created_at).getTime() -
          new Date(a.last_message_at || a.created_at).getTime(),
      ),
    [displayChats],
  );

  const activeChat =
    sortedChats.find((c) => c.id === activeChatId) ?? null;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-80 shrink-0 border-r md:block">
        <Sidebar
          profile={profile}
          chats={sortedChats}
          activeChat={activeChat}
          loading={chatLoading}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onChatsChange={refreshChats}
          onSignOut={signOut}
        />
      </aside>

      <main className="flex min-w-0 flex-1">
        <ChatBox
          chat={activeChat}
          myUserId={profile.id}
          messages={messages}
          typingUsers={activeChat ? typingUsers[activeChat.id] ?? {} : {}}
          loading={messageLoading}
          loadingOlder={olderLoading}
          onLoadOlder={loadOlder}
          onSendMessage={(content, attachment) =>
            sendMessage(activeChatId!, content, attachment)
          }
          onTyping={(t) => activeChatId && handleTyping(activeChatId, t)}
          onBack={() => router.replace("/chat")}
          onAudioCall={(c) => startCall(c, false)}
          onVideoCall={(c) => startCall(c, true)}
          callsEnabled={CALLS_ENABLED}
        />
      </main>

      <div className="fixed inset-0 z-50 bg-background md:hidden">
        {!activeChatId ? (
          <div className="flex h-full w-full">
            <Sidebar
              profile={profile}
              chats={sortedChats}
              activeChat={activeChat}
              loading={chatLoading}
              onSelectChat={selectChat}
              onDeleteChat={deleteChat}
              onChatsChange={refreshChats}
              onSignOut={signOut}
            />
          </div>
        ) : (
          <div className="flex h-full w-full bg-background">
            <ChatBox
              chat={activeChat}
              myUserId={profile.id}
              messages={messages}
              typingUsers={
                activeChat ? typingUsers[activeChat.id] ?? {} : {}
              }
              loading={messageLoading}
              loadingOlder={olderLoading}
              onLoadOlder={loadOlder}
              onSendMessage={(content, attachment) =>
                sendMessage(activeChatId!, content, attachment)
              }
              onTyping={(t) => activeChatId && handleTyping(activeChatId, t)}
              onBack={() => router.replace("/chat")}
              onAudioCall={(c) => startCall(c, false)}
              onVideoCall={(c) => startCall(c, true)}
              callsEnabled={CALLS_ENABLED}
            />
          </div>
        )}
      </div>

      <CallModal
        callState={callState}
        callerInfo={callerInfo}
        isVideo={isVideo}
        localStream={localStream}
        remoteStream={remoteStream}
        onAnswer={answerCall}
        onReject={rejectCall}
        onEndCall={endCall}
        onCancelCall={cancelCall}
      />
    </div>
  );
}

export default function ChatPage() {
  const profile = getGoogleProfile();

  if (!profile) {
    return <RedirectToHome />;
  }

  return (
    <Suspense>
      <ChatClient profile={profile} />
    </Suspense>
  );
}

function RedirectToHome() {
  useEffect(() => {
    window.location.replace("/");
  }, []);
  return (
    <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}
