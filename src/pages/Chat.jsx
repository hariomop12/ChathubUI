import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import Peer from "peerjs";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import CallModal from "../components/CallModal";
import { connectSocket, getSocket, disconnectSocket } from "../socket/socket";
import { api } from "../api/api";

const getDisplayName = (user) => user?.username || user?.fullName || "Someone";

const Chat = () => {
  const { user, isLoaded } = useUser();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const activeChatIdRef = useRef(null);
  const userIdRef = useRef(null);

  const peerRef = useRef(null);
  const peerIdRef = useRef(null);
  const mediaCallRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingPeerCallRef = useRef(null);
  const callerUserIdRef = useRef(null);

  const [callState, setCallState] = useState("idle");
  const [callerInfo, setCallerInfo] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    activeChatIdRef.current = activeChat?.id || null;
  }, [activeChat?.id]);

  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user?.id]);

  if (!isLoaded) return <div className="flex h-dvh items-center justify-center bg-bg text-text-muted text-lg">Loading...</div>;

  const getMediaStream = async (video) => {
    try {
      if (!video) {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      return stream;
    } catch (err) {
      if (video) {
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (audioErr) {
          return null;
        }
      }
      return null;
    }
  };

  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    if (mediaCallRef.current) {
      mediaCallRef.current.close();
      mediaCallRef.current = null;
    }
    pendingPeerCallRef.current = null;
    callerUserIdRef.current = null;
  }, []);

  const resetCallState = useCallback(() => {
    cleanupMedia();
    setCallState("idle");
    setCallerInfo(null);
    setIsVideo(false);
  }, [cleanupMedia]);

  const initiateCall = async (chat, video) => {
    if (!user || !chat?.other_user_id) {
      return;
    }

    const socket = getSocket();

    const handler = async (res) => {
      socket.off("peer-id-response", handler);

      if (!res?.peerId) {
        alert("User is offline");
        return;
      }

      const stream = await getMediaStream(video);
      if (!stream) {
        return;
      }

      const hasVideo = stream.getVideoTracks().length > 0;
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVideo(hasVideo);
      setCallerInfo({
        username: chat.other_username || "User",
        avatar: chat.other_avatar,
      });

      const peer = peerRef.current;
      if (!peer) {
        cleanupMedia();
        return;
      }

      const call = peer.call(res.peerId, stream);
      if (!call) {
        cleanupMedia();
        return;
      }
      mediaCallRef.current = call;

      setCallState("calling");

      socket.emit("call-user", {
        targetUserId: chat.other_user_id,
        callerId: user.id,
        callerUsername: getDisplayName(user),
        callerAvatar: user.imageUrl,
        isVideo: video,
      });

      call.on("stream", (remoteStream) => {
        remoteStreamRef.current = remoteStream;
        setRemoteStream(remoteStream);
        setCallState("connected");
      });

      call.on("close", () => {
        resetCallState();
      });

      call.on("error", (err) => {
        resetCallState();
      });
    };

    socket.on("peer-id-response", handler);
    socket.emit("get-peer-id", { targetUserId: chat.other_user_id });
  };

  const handleAudioCall = (chat) => {
    initiateCall(chat, false);
  };

  const handleVideoCall = (chat) => {
    initiateCall(chat, true);
  };

  const getCallTargetUserId = () => {
    return callerUserIdRef.current || activeChat?.other_user_id;
  };

  const answerCall = async () => {
    const peerCall = pendingPeerCallRef.current;
    if (!peerCall) return;

    const stream = await getMediaStream(isVideo);
    if (!stream) return;

    const hasVideo = stream.getVideoTracks().length > 0;
    setIsVideo(hasVideo);
    localStreamRef.current = stream;
    setLocalStream(stream);

    peerCall.answer(stream);
    mediaCallRef.current = peerCall;

    setCallState("connected");

    const targetUserId = getCallTargetUserId();
    if (targetUserId) {
      const socket = getSocket();
      socket.emit("call-answered", { targetUserId });
    }

    peerCall.on("stream", (remoteStream) => {
      remoteStreamRef.current = remoteStream;
      setRemoteStream(remoteStream);
    });

    peerCall.on("close", () => {
      resetCallState();
    });

    peerCall.on("error", (err) => {
      resetCallState();
    });
  };

  const rejectCall = () => {
    const peerCall = pendingPeerCallRef.current;
    if (peerCall) {
      peerCall.close();
    }
    const targetUserId = getCallTargetUserId();
    if (targetUserId) {
      const socket = getSocket();
      socket.emit("call-rejected", { targetUserId });
    }
    resetCallState();
  };

  const cancelCall = () => {
    const targetUserId = getCallTargetUserId();
    if (targetUserId) {
      const socket = getSocket();
      socket.emit("end-call", { targetUserId });
    }
    resetCallState();
  };

  const endCall = () => {
    const targetUserId = getCallTargetUserId();
    if (targetUserId) {
      const socket = getSocket();
      socket.emit("end-call", { targetUserId });
    }
    resetCallState();
  };

  const fetchChats = useCallback(async () => {
    try {
      const data = await api.getChats();
      if (data?.[0]) {
      }
      setChats(Array.isArray(data) ? data : []);
    } catch (err) {
      setChats([]);
    }
  }, []);

  const fetchMessages = useCallback(async (chatId) => {
    try {
      const data = await api.getMessages(chatId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    const socket = connectSocket();

    const registerUser = () => {
      const uid = userIdRef.current;
      if (!uid) return;
      socket.emit("register-user", { userId: uid });
      if (peerIdRef.current) {
        socket.emit("register-peer", { userId: uid, peerId: peerIdRef.current });
      }
      const cid = activeChatIdRef.current;
      if (cid) {
        socket.emit("join-room", { chatId: cid });
      }
    };

    socket.on("connect", () => {
      registerUser();
    });

    socket.on("receive-message", (message) => {
      setMessages((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        if (current.some((m) => m.id === message.id)) {
          return current;
        }
        return [...current, message];
      });
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[message.sender_id];
        return next;
      });
      fetchChats();
    });

    socket.on("user-typing", ({ chatId, userId, username }) => {
      setTypingUsers((prev) => {
        if (userId === userIdRef.current || chatId !== activeChatIdRef.current)
          return prev;
        return { ...prev, [userId]: username || "Someone" };
      });
    });

    socket.on("user-stop-typing", ({ chatId, userId }) => {
      setTypingUsers((prev) => {
        if (userId === userIdRef.current || chatId !== activeChatIdRef.current)
          return prev;
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on("user-presence", ({ userId, online }) => {
      setChats((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) =>
          c.other_user_id === userId ? { ...c, other_online: online } : c,
        ),
      );
    });

    return () => {
      disconnectSocket();
    };
  }, [fetchChats]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("register-user", { userId: user.id });
      if (peerIdRef.current) {
        socket.emit("register-peer", { userId: user.id, peerId: peerIdRef.current });
      }
      if (activeChatIdRef.current) {
        socket.emit("join-room", { chatId: activeChatIdRef.current });
      }
    } else {
    }

    let peer = null;
    const peerInitTimer = window.setTimeout(() => {
      const peerId = crypto.randomUUID();
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const apiUrl = new URL(API_URL);
      const peerHost = import.meta.env.VITE_PEER_HOST || apiUrl.hostname;
      const peerPort = import.meta.env.VITE_PEER_PORT ? Number(import.meta.env.VITE_PEER_PORT) : undefined;
      const peerPath = import.meta.env.VITE_PEER_PATH || "/peerjs";
      const socket = getSocket() || connectSocket();

      try {
        peer = new Peer(peerId, {
          host: peerHost,
          port: peerPort,
          path: peerPath,
          secure: apiUrl.protocol === "https:",
        });
      } catch (err) {
        return;
      }
      peerRef.current = peer;

      peer.on("open", (id) => {
        peerIdRef.current = id;
        socket.emit("register-peer", { userId: user.id, peerId: id });
      });

      peer.on("call", (call) => {
        pendingPeerCallRef.current = call;
        setCallState((prev) => {
          if (prev === "idle") return "incoming";
          return prev;
        });
      });

      peer.on("error", (err) => {
      });

      peer.on("disconnected", () => {
      });

      peer.on("close", () => {
      });
    }, 100);

    return () => {
      window.clearTimeout(peerInitTimer);
      cleanupMedia();
      if (peer) {
        peer.destroy();
      }
      if (peerRef.current === peer) {
        peerRef.current = null;
      }
    };
  }, [user?.id, cleanupMedia]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("incoming-call", ({ callerId, callerUsername, callerAvatar, isVideo }) => {
      callerUserIdRef.current = callerId;
      setCallState("incoming");
      setCallerInfo({ username: callerUsername, avatar: callerAvatar, callerId });
      setIsVideo(isVideo);
    });

    socket.on("call-answered", () => {
      // PeerJS handles media signaling automatically
    });

    socket.on("call-rejected", () => {
      resetCallState();
    });

    socket.on("call-ended", () => {
      resetCallState();
    });

    socket.on("user-busy", () => {
      resetCallState();
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("call-rejected");
      socket.off("call-ended");
      socket.off("user-busy");
    };
  }, [resetCallState]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      const socket = getSocket();
      socket.emit("join-room", { chatId: activeChat.id });

      return () => {
        socket.emit("leave-room", { chatId: activeChat.id });
        setTypingUsers({});
      };
    } else {
      setMessages([]);
      setTypingUsers({});
    }
  }, [activeChat, fetchMessages]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
  };

  const handleBackToChats = () => {
    setActiveChat(null);
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await api.deleteChat(chatId);
      if (activeChat?.id === chatId) {
        setActiveChat(null);
        setMessages([]);
        setTypingUsers({});
      }
      await fetchChats();
    } catch (err) {
    }
  };

  const handleSendMessage = async (content, fileInfo) => {
    if (!activeChat || !user) {
      return;
    }
    try {
      const msg = await api.sendMessage(activeChat.id, {
        content,
        fileUrl: fileInfo?.url || null,
        fileName: fileInfo?.name || null,
        fileType: fileInfo?.type || null,
        fileSize: fileInfo?.size || null,
      });
      setMessages((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        if (current.some((m) => m.id === msg.id)) return current;
        return [...current, msg];
      });
    } catch (err) {
    }
    getSocket().emit("stop-typing", { chatId: activeChat.id, userId: user.id });
  };

  const handleTyping = useCallback(
    (isTyping) => {
      if (!activeChat || !user) return;

      const socket = getSocket();
      if (!socket) return;

      socket.emit(isTyping ? "typing" : "stop-typing", {
        chatId: activeChat.id,
        userId: user.id,
        username: getDisplayName(user),
      });
    },
    [activeChat, user],
  );

  return (
    <div
      className={`chat-layout flex h-dvh bg-bg text-text overflow-hidden ${activeChat ? "has-active-chat" : ""}`}
    >
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onChatsChange={fetchChats}
      />
      <ChatBox
        chat={activeChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        typingUsers={typingUsers}
        onBack={handleBackToChats}
        onAudioCall={handleAudioCall}
        onVideoCall={handleVideoCall}
      />
      <CallModal
        callState={callState}
        localStream={localStream}
        remoteStream={remoteStream}
        callerInfo={callerInfo}
        isVideo={isVideo}
        onAnswer={answerCall}
        onReject={rejectCall}
        onEndCall={endCall}
        onCancelCall={cancelCall}
      />
    </div>
  );
};

export default Chat;
