import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../api/auth.api.js";
import useAuthStore from "../store/auth.store.js";
import { useEffect } from "react";

const useAuth = () => {
  const { setUser, isAuthenticated } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data?.data?.data) {
      setUser(data.data.data);
    }
  }, [data, setUser]);

  return { isLoading, error };
};

export default useAuth;
