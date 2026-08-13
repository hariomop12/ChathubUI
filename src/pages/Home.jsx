import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { MessageCircle, ArrowRight, Shield, Users, Plus } from "lucide-react";
import { api } from "../api/api";
import clsx from "clsx";

const Home = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.getChats().then(setChats).catch(() => {});
    api.getUsers().then(setUsers).catch(() => {});
  }, []);

  const recentChats = chats.slice(0, 3);
  const otherUsers = users.filter((u) => u.id !== user?.id).slice(0, 5);
  const onlineCount = otherUsers.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[var(--home-bg-start)] via-[var(--home-bg-mid)] to-[var(--home-bg-end)] bg-[length:400%_400%] animate-gradient-shift p-5 relative overflow-hidden">
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-10%",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#4f46e5] to-[#6366f1] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <span className="text-lg font-bold text-text tracking-tight">ChatHub</span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      <div className="text-center max-w-[480px] w-full animate-slide-up relative z-10">
        <div className="mb-7">
          <div className="w-[88px] h-[88px] rounded-full p-[3px] bg-gradient-to-br from-[#4f46e5] to-[#818cf8] mx-auto mb-6 shadow-[0_8px_24px_rgba(79,70,229,0.2)]">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-primary-bg flex items-center justify-center text-[32px] font-bold text-primary">
                {user?.firstName?.[0] || user?.username?.[0] || "?"}
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold text-text mb-3 tracking-tighter">
            Welcome back, <span className="bg-gradient-to-br from-[#4f46e5] to-[#818cf8] bg-clip-text text-transparent">{user?.firstName || "Friend"}</span>!
          </h1>
          <p className="text-lg text-text-muted leading-relaxed">
            Your secure conversations are waiting
          </p>
        </div>

        <div className="flex gap-3 mb-7 justify-center">
          <div className="flex-1 max-w-[140px] flex flex-col items-center gap-1.5 py-[18px] px-3 rounded-md bg-bg-card shadow-md border border-border">
            <MessageCircle size={18} className="text-primary" />
            <span className="text-2xl font-bold text-text">{chats.length}</span>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Chats</span>
          </div>
          <div className="flex-1 max-w-[140px] flex flex-col items-center gap-1.5 py-[18px] px-3 rounded-md bg-bg-card shadow-md border border-border">
            <Users size={18} className="text-primary" />
            <span className="text-2xl font-bold text-text">{onlineCount}</span>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Online</span>
          </div>
          <div className="flex-1 max-w-[140px] flex flex-col items-center gap-1.5 py-[18px] px-3 rounded-md bg-bg-card shadow-md border border-border">
            <Shield size={18} className="text-primary" />
            <span className="text-2xl font-bold text-text">E2E</span>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Encrypted</span>
          </div>
        </div>

        {recentChats.length > 0 && (
          <div className="text-left mb-5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2.5 pl-1">Recent Chats</div>
            {recentChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => navigate("/chat")}
                className="flex items-center gap-3 px-3.5 py-3 rounded-md bg-bg-card border border-border cursor-pointer mb-2 transition-all duration-200 shadow-sm"
              >
                {chat.other_avatar && (
                  <img src={chat.other_avatar} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-border" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text">{chat.other_username || "Direct Chat"}</div>
                  {chat.last_message && (
                    <div className="text-xs text-text-muted overflow-hidden whitespace-nowrap truncate mt-0.5">{chat.last_message}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {otherUsers.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2.5 pl-1">Online Now</div>
            <div className="flex justify-center gap-2">
              {otherUsers.map((u) => (
                <div key={u.id} className="relative">
                  <img src={u.avatar} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-border" />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-[3px] border-bg-card" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center mb-5">
          <button
            onClick={() => navigate("/chat")}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold bg-gradient-to-br from-[#4f46e5] to-[#6366f1] text-white border-0 rounded-md cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(79,70,229,0.25)] flex-1 hover:translate-y-[-2px] hover:shadow-xl"
          >
            Open Chats
            <ArrowRight size={20} />
          </button>
          <button
            onClick={() => navigate("/chat")}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 text-sm font-semibold bg-bg-card text-text border border-border rounded-md cursor-pointer transition-all duration-200 shadow-sm hover:-translate-y-0.5"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-bg text-primary text-sm font-semibold">
          <Shield size={14} />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
