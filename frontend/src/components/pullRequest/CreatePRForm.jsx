import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPR } from "../../api/pullRequest.api.js";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button.jsx";
import Input from "../common/Input.jsx";
import toast from "react-hot-toast";

const CreatePRForm = ({ fileId, repoId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => createPR(fileId, data),
    onSuccess: (res) => {
      const prId = res.data.data._id;
      queryClient.invalidateQueries({ queryKey: ["prs", repoId] });
      toast.success("Pull request created!");
      navigate(`/repos/${repoId}/prs/${prId}`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to create PR");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("PR title is required");
      return;
    }
    mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#161b22] border border-[#30363d] rounded-xl p-5">
      <h2 className="text-base font-semibold text-gray-100">Open Pull Request</h2>

      <Input
        id="pr-title"
        label="Title *"
        placeholder="Add a concise PR title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="pr-description" className="text-sm font-medium text-gray-300">
          Description
        </label>
        <textarea
          id="pr-description"
          placeholder="Describe the changes in this PR..."
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={5}
          className="w-full bg-[#0d1117] border border-[#30363d] hover:border-[#6e7681] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-colors resize-none"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" loading={isPending}>
          Open PR
        </Button>
      </div>
    </form>
  );
};

export default CreatePRForm;
