import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPR, reviewPR, getPRsByRepo } from "../api/pullRequest.api.js";
import toast from "react-hot-toast";

export const usePRsByRepo = (repoId) => {
  return useQuery({
    queryKey: ["prs", repoId],
    queryFn: () => getPRsByRepo(repoId),
    enabled: !!repoId,
  });
};

export const useCreatePR = (fileId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createPR(fileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prs"] });
      toast.success("Pull request created!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to create PR");
    },
  });
};

export const useReviewPR = (prId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => reviewPR(prId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pr", prId] });
      queryClient.invalidateQueries({ queryKey: ["prs"] });
      toast.success("Review submitted!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to submit review");
    },
  });
};
