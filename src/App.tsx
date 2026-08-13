import { useEffect } from "react";
import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Analytics } from "@vercel/analytics/react";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import { api, setTokenProvider } from "./api/api";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <div className="text-white p-10">Loading...</div>;
  if (!isSignedIn) return <Navigate to="/login" />;
  return children;
}

function AuthSync() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    setTokenProvider(getToken);
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn && user) {
      api.upsertUser({
        id: user.id,
        username: user.username || user.fullName || "Anonymous",
        email: user.primaryEmailAddress?.emailAddress || "",
        avatar: user.imageUrl,
      }).catch(() => {});
    }
  }, [isSignedIn, user]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthSync />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
