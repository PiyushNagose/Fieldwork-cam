/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiClient } from "../api/client";

const AuthContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    authUserId: user.authUserId || user.id || "",
  };
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("auth_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("auth_user");
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  });
  const [initializing, setInitializing] = useState(true);

  const login = (authData) => {
    const nextToken = authData?.token || "";
    const nextUser = normalizeUser(authData?.user || null);

    localStorage.setItem("auth_token", nextToken);
    localStorage.setItem("auth_user", JSON.stringify(nextUser));

    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken("");
    setUser(null);
    window.location.href = "/login";
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken("");
      setUser(null);
      setInitializing(false);

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    };

    window.addEventListener("fieldwork:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("fieldwork:unauthorized", handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    const validateSession = async () => {
      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const role = String(user?.role || "").toUpperCase();

        if (role === "VENDOR_OWNER") {
          await apiClient.get("/vendors/me/profile");
        } else {
          await apiClient.get("/users/profile");
        }
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setToken("");
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    validateSession();
  }, [token, user?.role]);

  useEffect(() => {
    const role = String(user?.role || "").toUpperCase();
    document.title = role === "VENDOR_OWNER" ? "Vendor Web" : "Admin Web";
  }, [user?.role]);

  const value = useMemo(
    () => ({
      token,
      user,
      initializing,
      isAuthenticated: !!token,
      login,
      logout,
    }),
    [initializing, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
