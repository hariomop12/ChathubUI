import { useEffect } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { api, setTokenProvider } from "../api/api";

export const useAuth = () => {
  const { isSignedIn, isLoaded, getToken } = useClerkAuth();
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
      });
    }
  }, [isSignedIn, user]);

  return { isSignedIn, isLoaded, user };
};
