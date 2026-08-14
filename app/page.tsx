"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { ArrowRight, Lock, MessageSquare, ShieldCheck, Zap } from "lucide-react";

import { Logo } from "@/components/logo";
import { getGoogleProfile, setGoogleToken } from "@/lib/auth";
import { api } from "@/lib/api";

const features = [
  { icon: Zap, title: "Instant", desc: "Real-time delivery" },
  { icon: MessageSquare, title: "1:1 & Groups", desc: "Chat with anyone" },
  { icon: ShieldCheck, title: "Secure", desc: "Google account auth" },
];

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getGoogleProfile()) {
      router.replace("/chat");
    }
  }, [router]);

  const handleLogin = async (credential: string) => {
    setLoading(true);
    try {
      setGoogleToken(credential);
      const profile = getGoogleProfile();
      if (!profile) {
        throw new Error("Could not read the ID token");
      }
      await api.upsertUser({
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar,
      });
      router.push("/chat");
    } catch (err) {
      console.error("login error", err);
      toast.error(
        err instanceof Error && err.message !== "Could not read the ID token"
          ? "Could not connect to the server. Is the backend running?"
          : "Sign-in failed. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      {/* Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.08), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
        }}
      />

      <div className="animate-slide-up relative z-10 w-full max-w-md">
        {/* Top bar */}
        <div className="mb-10 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Online
          </div>
        </div>

        <div className="border bg-card/50 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-6 p-8">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                Where conversations{" "}
                <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                  come alive
                </span>
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Real-time chat with voice &amp; video calls and file sharing.
                Private by design, beautiful by default.
              </p>
            </div>

            <GoogleLogin
              onSuccess={({ credential }) => {
                if (!credential) {
                  toast.error("Sign-in failed. Please try again.");
                  setLoading(false);
                  return;
                }
                void handleLogin(credential);
              }}
              onError={() => {
                console.error("google login error");
                toast.error(
                  "Google sign-in blocked. Make sure localhost:3001 is an allowed origin in the Google OAuth client.",
                );
                setLoading(false);
              }}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
              width={384}
            />

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span className="flex items-center gap-1.5">
                <Lock className="size-3" /> Secured by Google
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>

          <div className="flex items-center justify-around border-t bg-secondary/40 px-6 py-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-2">
                <f.icon className="size-3.5 text-muted-foreground" />
                <div className="leading-tight">
                  <div className="text-xs font-medium">{f.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push("/home")}
          className="group mt-6 flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Browse features
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </main>
  );
}
