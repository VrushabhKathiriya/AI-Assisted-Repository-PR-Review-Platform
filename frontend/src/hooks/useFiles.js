import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
} from "../api/file.api.js";
import toast from "react-hot-toast";

export const useFiles = (repoId) => {
  return useQuery({
    queryKey: ["files", repoId],
    queryFn: () => getFiles(repoId),
    enabled: !!repoId,
  });
};

export const useFileById = (fileId) => {
  return useQuery({
    queryKey: ["file", fileId],
    queryFn: () => getFileById(fileId),
    enabled: !!fileId,
  });
};

export const useCreateFile = (repoId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createFile(repoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", repoId] });
      toast.success("File created!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to create file");
    },
  });
};

export const useUpdateFile = (fileId, repoId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateFile(fileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file", fileId] });
      queryClient.invalidateQueries({ queryKey: ["files", repoId] });
      toast.success("File updated!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update file");
    },
  });
};

export const useDeleteFile = (repoId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId) => deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", repoId] });
      toast.success("File deleted!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to delete file");
    },
  });
};
