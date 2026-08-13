import { SignIn, useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import clsx from "clsx";

const taglines = [
  "Secure. Instant. Seamless.",
  "Talk. Share. Connect.",
  "Your privacy, our priority.",
];

const Login = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((i) => (i + 1) % taglines.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  if (isLoaded && isSignedIn) return <Navigate to="/chat" />;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#0b1120] via-[#1a1f36] to-[#0f1923] bg-[length:400%_400%] animate-gradient-shift p-5 relative overflow-hidden">
      <style>{`
        @media (max-width: 900px) {
          .login-container { flex-direction: column !important; gap: 32px !important; text-align: center !important; }
          .login-hero { max-width: 480px !important; }
          .login-title { font-size: 32px !important; }
          .login-subtitle { font-size: 15px !important; }
          .login-features { align-items: center !important; }
          .login-review { justify-content: center !important; }
          .login-form { max-width: 100% !important; }
          .login-form-inner { padding: 24px !important; }
          .login-badge { margin-left: auto !important; margin-right: auto !important; }
          .login-logo { display: flex !important; justify-content: center !important; }
          .login-mockup { display: none !important; }
          .orb-1 { width: 300px !important; height: 300px !important; top: -10% !important; }
          .orb-2 { width: 250px !important; height: 250px !important; }
          .orb-3 { width: 200px !important; height: 200px !important; }
        }
        @media (max-width: 480px) {
          .login-title { font-size: 26px !important; }
          .login-form-inner { padding: 20px 16px !important; }
          .login-hero { margin-bottom: 0 !important; }
          .login-float1 { display: none !important; }
          .login-float2 { display: none !important; }
          .login-float3 { display: none !important; }
        }
      `}</style>

      {/* Animated gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(236,72,153,0.06) 0%, transparent 50%)",
        }}
      />

      {/* Animated gradient orbs */}
      <div
        className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none orb-1"
        style={{
          background:
            "radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, rgba(99, 102, 241, 0.05) 40%, transparent 70%)",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[-20%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none orb-2"
        style={{
          background:
            "radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, rgba(236, 72, 153, 0.03) 40%, transparent 70%)",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full pointer-events-none orb-3"
        style={{
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 60%)",
          animation: "float 12s ease-in-out infinite 2s",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 bg-[length:60px_60px] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        }}
      />

      {/* Floating icons */}
      <div
        className="login-float1 absolute top-[12%] left-[8%] text-[rgba(99,102,241,0.3)] pointer-events-none"
        style={{ animation: "float 7s ease-in-out infinite" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      </div>
      <div
        className="login-float2 absolute bottom-[18%] right-[12%] text-[rgba(236,72,153,0.25)] pointer-events-none"
        style={{ animation: "float 9s ease-in-out infinite reverse" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
      </div>
      <div
        className="login-float3 absolute top-[55%] left-[5%] text-[rgba(59,130,246,0.2)] pointer-events-none"
        style={{ animation: "float 11s ease-in-out infinite 3s" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-35"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
      </div>

      <div className="login-container flex gap-12 items-center max-w-[1100px] w-full relative z-10">
        {/* Left: Hero */}
        <div className="login-hero flex-1 text-white animate-slide-up">
          <div className="login-badge inline-flex px-3.5 py-1.5 rounded-full border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.08)] text-[#a5b4fc] text-xs font-semibold tracking-wide mb-6 backdrop-blur-sm">✨ Real-time messaging</div>

          <div className="login-logo mb-5">
            <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#4f46e5] to-[#6366f1] flex items-center justify-center shadow-[0_8px_24px_rgba(79,70,229,0.35),0_0_40px_rgba(79,70,229,0.15)]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
          </div>

          <h1 className="login-title text-5xl font-extrabold mb-3 tracking-tight leading-tight">
            Where conversations{" "}
            <span className="bg-gradient-to-br from-[#818cf8] via-[#a78bfa] to-[#f472b6] bg-clip-text text-transparent">come alive</span>
          </h1>

          <p className="login-subtitle text-lg font-normal text-[rgba(255,255,255,0.5)] mb-9 min-h-[28px]" key={taglineIndex}>
            {taglines[taglineIndex]}
            <span className="inline-block ml-0.5 font-thin text-[rgba(255,255,255,0.3)]" style={{ animation: "pulse 1s step-end infinite" }}>|</span>
          </p>

          <div className="login-features flex flex-col gap-3.5 mb-9">
            <div className="flex items-center gap-3 text-sm text-[rgba(255,255,255,0.65)] font-medium">
              <div className="w-7 h-7 rounded-lg bg-[rgba(99,102,241,0.12)] flex items-center justify-center text-[#818cf8] shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
              </div>
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[rgba(255,255,255,0.65)] font-medium">
              <div className="w-7 h-7 rounded-lg bg-[rgba(99,102,241,0.12)] flex items-center justify-center text-[#818cf8] shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
              </div>
              <span>Voice & video calls</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[rgba(255,255,255,0.65)] font-medium">
              <div className="w-7 h-7 rounded-lg bg-[rgba(99,102,241,0.12)] flex items-center justify-center text-[#818cf8] shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              </div>
              <span>File sharing</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[rgba(255,255,255,0.65)] font-medium">
              <div className="w-7 h-7 rounded-lg bg-[rgba(99,102,241,0.12)] flex items-center justify-center text-[#818cf8] shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <span>Lightning fast</span>
            </div>
          </div>

          <div className="login-review flex items-center gap-3 mb-8">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-[rgba(255,255,255,0.25)] -mr-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
              ))}
            </div>
            <span className="text-sm text-[rgba(255,255,255,0.45)]">
              <strong>1,200+</strong> users love ChatHub
            </span>
          </div>

          {/* Mock Chat Preview */}
          <div className="login-mockup bg-[rgba(15,23,42,0.5)] rounded-2xl border border-[rgba(148,163,184,0.12)] overflow-hidden backdrop-blur-md max-w-[360px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(148,163,184,0.08)]">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full opacity-70" style={{ background: "#ef4444" }} />
                <span className="w-2 h-2 rounded-full opacity-70" style={{ background: "#f59e0b" }} />
                <span className="w-2 h-2 rounded-full opacity-70" style={{ background: "#22c55e" }} />
              </div>
              <div className="text-xs font-semibold text-[rgba(255,255,255,0.5)] tracking-wide">ChatHub</div>
              <div className="w-10" />
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-2.5">
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] shrink-0" />
                <div>
                  <div className="bg-[rgba(99,102,241,0.15)] rounded-[0_14px_14px_14px] px-3.5 py-2.5 text-xs text-[rgba(255,255,255,0.75)] leading-[1.4] max-w-[80%]">Hey! How are you?</div>
                  <div className="bg-[rgba(99,102,241,0.15)] rounded-[0_14px_14px_14px] px-3.5 py-2.5 text-xs text-[rgba(255,255,255,0.75)] leading-[1.4] max-w-[80%] mt-1 w-[60%]">Want to catch up?</div>
                </div>
              </div>
              <div className="flex justify-end">
                <div>
                  <div className="bg-[rgba(99,102,241,0.25)] rounded-[14px_0_14px_14px] px-3.5 py-2.5 text-xs text-[rgba(255,255,255,0.8)] leading-[1.4] max-w-[80%]">Hey! I'm great!</div>
                  <div className="bg-[rgba(99,102,241,0.25)] rounded-[14px_0_14px_14px] px-3.5 py-2.5 text-xs text-[rgba(255,255,255,0.8)] leading-[1.4] max-w-[80%] mt-1 w-[50%]">Sure, let's do it</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-[10px] bg-[rgba(148,163,184,0.06)] border border-[rgba(148,163,184,0.08)]">
                <div className="flex-1 text-xs text-[rgba(255,255,255,0.25)]">Type a message...</div>
                <div className="w-7 h-7 rounded-lg bg-[rgba(99,102,241,0.3)] flex items-center justify-center text-[rgba(255,255,255,0.4)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sign-in */}
        <div className="login-form flex-1 w-full max-w-[440px]" style={{ animation: "slideUp 0.5s ease-out 0.1s both" }}>
          <div className="login-form-inner bg-gradient-to-b from-[rgba(15,23,42,0.84)] to-[rgba(15,23,42,0.72)] rounded-3xl p-7 border border-[rgba(148,163,184,0.18)] shadow-[0_24px_70px_-18px_rgba(2,6,23,0.75),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl">
            <div className="mb-[18px] text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.08em] uppercase text-[#a5b4fc] mb-2.5">Secure access</div>
              <h2 className="text-[#f8fafc] text-[28px] leading-[1.1] tracking-[-0.03em] font-extrabold mb-2">Sign in to ChatHub</h2>
              <p className="text-[#94a3b8] text-sm leading-relaxed">One place for chat, calls, and file sharing.</p>
            </div>
            <SignIn
              afterSignInUrl="/chat"
              appearance={{
                variables: {
                  colorPrimary: "#818cf8",
                  colorText: "#e2e8f0",
                  colorBackground: "transparent",
                  colorInputBackground: "rgba(15, 23, 42, 0.55)",
                  colorInputText: "#f8fafc",
                  colorInputBorder: "rgba(148, 163, 184, 0.24)",
                  borderRadius: "14px",
                },
                elements: {
                  rootBox: {
                    margin: "0 auto",
                    width: "100%",
                  },
                  card: {
                    background: "transparent",
                    border: "none",
                    boxShadow: "none",
                    borderRadius: "0",
                    color: "#f8fafc",
                    padding: 0,
                    width: "100%",
                  },
                  headerTitle: {
                    color: "#f8fafc",
                    fontWeight: 700,
                    fontSize: "22px",
                    display: "none",
                  },
                  headerSubtitle: { color: "#94a3b8", fontSize: "14px", display: "none" },
                  socialButtonsBlockButton: {
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    fontWeight: 700,
                    padding: "14px 16px",
                    background: "linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(226, 232, 240, 0.96) 100%)",
                    color: "#0f172a",
                    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.18)",
                  },
                  socialButtonsBlockButtonText: {
                    color: "#0f172a",
                    fontWeight: 700,
                  },
                  socialButtonsBlockButtonArrow: {
                    color: "#334155",
                  },
                  formFieldLabel: {
                    color: "#cbd5e1",
                    fontWeight: 600,
                    fontSize: "13px",
                  },
                  formFieldInput: {
                    borderRadius: "12px",
                    border: "1px solid rgba(148, 163, 184, 0.22)",
                    backgroundColor: "rgba(15, 23, 42, 0.55)",
                    color: "#f8fafc",
                    boxShadow: "none",
                  },
                  formFieldInputShowPasswordButton: {
                    color: "#cbd5e1",
                  },
                  formFieldAction: {
                    color: "#a5b4fc",
                  },
                  formButtonPrimary: {
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                    borderRadius: "12px",
                    fontWeight: 600,
                    padding: "12px",
                    boxShadow: "0 12px 30px rgba(99, 102, 241, 0.28)",
                  },
                  footerAction: { color: "#94a3b8" },
                  footerActionLink: { color: "#a5b4fc", fontWeight: 700 },
                  dividerLine: {
                    background: "rgba(148, 163, 184, 0.18)",
                  },
                  dividerText: {
                    color: "#94a3b8",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
