import { useAuth as useClerkAuthHook, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut, getToken, isLoaded: isAuthLoaded } = useClerkAuthHook();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoaded && isAuthLoaded) {
      setIsLoading(false);
    }
  }, [isUserLoaded, isAuthLoaded]);

  return {
    isLoading,
    isAuthenticated: !!user && !!getToken,
    user,
    signOut,
    userId: user?.id,
    getToken,
  };
}; 