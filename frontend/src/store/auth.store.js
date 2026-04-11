import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setToken: (token) => {
        // Also keep in plain localStorage so the axios interceptor can read it
        localStorage.setItem("accessToken", token);
        set({ accessToken: token });
      },

      setAuth: (user, token) => {
        localStorage.setItem("accessToken", token);
        set({ user, accessToken: token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // Re-sync plain localStorage key on hydration
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          localStorage.setItem("accessToken", state.accessToken);
        }
      },
    }
  )
);

export default useAuthStore;