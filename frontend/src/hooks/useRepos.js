import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRepos,
  getRepoById,
  createRepo,
  updateRepo,
  deleteRepo,
} from "../api/repository.api.js";
import toast from "react-hot-toast";

export const useRepos = () => {
  return useQuery({
    queryKey: ["repos"],
    queryFn: () => getRepos(),
  });
};

export const useRepoById = (repoId) => {
  return useQuery({
    queryKey: ["repo", repoId],
    queryFn: () => getRepoById(repoId),
    enabled: !!repoId,
  });
};

export const useCreateRepo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRepo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      toast.success("Repository created!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to create repository");
    },
  });
};

export const useUpdateRepo = (repoId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateRepo(repoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repo", repoId] });
      toast.success("Repository updated!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update repository");
    },
  });
};

export const useDeleteRepo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (repoId) => deleteRepo(repoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      toast.success("Repository deleted!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to delete repository");
    },
  });
};
