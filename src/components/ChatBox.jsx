import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { ArrowLeft, Paperclip, X, FileText, Image, Loader, Phone, Video } from "lucide-react";
import { api } from "../api/api";
import Message from "./Message";

const MAX_SIZE = 50 * 1024 * 1024;

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const ChatBox = ({
  chat,
  messages,
  onSendMessage,
  onTyping,
  typingUsers,
  onBack,
  onAudioCall,
  onVideoCall,
}) => {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileInfo, setFileInfo] = useState(null);
  const [fileError, setFileError] = useState("");
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const displayedProgressRef = useRef(0);
  const progressTargetRef = useRef(0);
  const progressTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const onTypingRef = useRef(onTyping);

  onTypingRef.current = onTyping;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() && !fileInfo) return;
    onTypingRef.current(false);
    onSendMessage(input.trim(), fileInfo);
    setInput("");
    setFileInfo(null);
    setFileError("");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    onTypingRef.current(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingRef.current(false);
    }, 1200);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");

    if (file.size > MAX_SIZE) {
      setFileError("File exceeds 50MB limit");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    displayedProgressRef.current = 0;
    progressTargetRef.current = 8;

    progressTimerRef.current = setInterval(() => {
      setUploadProgress((current) => {
        const target = progressTargetRef.current;
        if (current >= target) {
          displayedProgressRef.current = current;
          return current;
        }

        const next = Math.min(current + 2, target);
        displayedProgressRef.current = next;
        return next;
      });
    }, 120);

    try {
      const result = await api.uploadFile(file, (progress) => {
        progressTargetRef.current = Math.max(
          progressTargetRef.current,
          Math.min(progress, 95),
        );
      });

      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      await new Promise((resolve) => {
        const timer = setInterval(() => {
          const next = Math.min(displayedProgressRef.current + 5, 100);
          displayedProgressRef.current = next;
          setUploadProgress(next);

          if (next === 100) {
            clearInterval(timer);
            resolve();
          }
        }, 45);
      });

      setFileInfo(result);
    } catch (err) {
      setFileError(err.message || "Upload failed");
    } finally {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setUploading(false);
      e.target.value = "";
    }
  };

  const clearFile = () => {
    setFileInfo(null);
    setFileError("");
    setUploadProgress(0);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      onTypingRef.current(false);
    };
  }, [chat?.id]);

  const typingNames = Object.values(typingUsers || {});
  const typingText =
    typingNames.length === 1
      ? `${typingNames[0]} is typing`
      : typingNames.length > 1
        ? `${typingNames.length} people are typing...`
        : "";

  if (!chat) {
    return (
      <div className="chat-empty-state flex-1 flex items-center justify-center text-text-muted text-base font-medium bg-bg">
        Select a chat to start messaging
      </div>
    );
  }

  const canCall = Boolean(chat?.other_user_id) && !chat?.is_group;
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="chat-panel flex-1 flex flex-col bg-bg relative">
      <div className="chat-header px-5 py-3.5 border-b border-border bg-bg-card flex items-center gap-3 shadow-sm z-10">
        <button
          type="button"
          className="mobile-back-button w-[38px] h-[38px] border border-border rounded-sm bg-bg-card text-text-secondary cursor-pointer hidden items-center justify-center shrink-0 hover:bg-bg-hover hover:text-text"
          onClick={onBack}
          aria-label="Back to chats"
        >
          <ArrowLeft size={19} strokeWidth={2.2} />
        </button>
        {chat.other_avatar && (
          <img
            className="chat-header-avatar w-10 h-10 rounded-full border-2 border-border"
            src={chat.other_avatar}
            alt=""
          />
        )}
        <strong className="text-text text-base flex-1 font-semibold">
          {chat.other_username || chat.name || "Direct Chat"}
        </strong>
        {canCall && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onAudioCall?.(chat)}
              title="Audio call"
              aria-label="Audio call"
              className="w-9 h-9 rounded-sm border border-border bg-bg-card text-call-green cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[rgba(34,197,94,0.08)] hover:border-call-green"
            >
              <Phone size={16} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => onVideoCall?.(chat)}
              title="Video call"
              aria-label="Video call"
              className="w-9 h-9 rounded-sm border border-border bg-bg-card text-call-blue cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-[rgba(59,130,246,0.08)] hover:border-call-blue"
            >
              <Video size={16} strokeWidth={2.2} />
            </button>
          </div>
        )}
      </div>

      <div className="messages-scroll flex-1 overflow-y-auto p-5 bg-bg">
        {safeMessages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === user?.id}
          />
        ))}
        {typingText && (
          <div className="mt-2 text-text-secondary text-sm flex items-center gap-2">
            <span>{typingText}</span>
            <span className="typing-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="message-form px-5 py-3.5 border-t border-border flex gap-2.5 bg-bg-card shadow-[0_-1px_3px_rgba(0,0,0,0.04)]"
        onSubmit={handleSubmit}
      >
        <input
          value={input}
          onChange={handleInputChange}
          onBlur={() => onTypingRef.current(false)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-sm border border-border bg-bg text-text outline-none text-sm focus:border-primary-light focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />

        {fileInfo ? (
          <div className="selected-file-chip flex items-center gap-2 px-3 py-1.5 bg-bg-hover rounded-sm border border-border max-w-[200px]">
            {fileInfo.type?.startsWith("image/") ? (
              <Image size={16} className="text-primary-light" />
            ) : (
              <FileText size={16} className="text-primary-light" />
            )}
            <span className="text-sm text-text truncate flex-1">
              {fileInfo.name}
            </span>
            <span className="text-xs text-text-muted shrink-0">
              {formatSize(fileInfo.size)}
            </span>
            <button
              type="button"
              onClick={clearFile}
              className="bg-transparent border-none text-text-muted cursor-pointer p-0.5 flex"
            >
              <X size={14} />
            </button>
          </div>
        ) : uploading ? (
          <div className="upload-progress-chip flex items-center gap-1.5 px-3 py-1.5 bg-bg-hover rounded-sm border border-border">
            <Loader size={16} className="animate-spin text-primary-light" />
            <span className="text-sm text-text-secondary">
              {uploadProgress}%
            </span>
          </div>
        ) : null}

        <button
          className="attach-button w-[42px] h-[42px] border border-border rounded-sm bg-bg-card text-text-secondary cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-bg-hover hover:text-text disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip size={18} strokeWidth={2.2} />
        </button>
        <button
          className="send-button px-5 py-2.5 bg-gradient-to-br from-primary to-primary-light text-white border-none rounded-sm cursor-pointer font-semibold text-sm shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
          type="submit"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
