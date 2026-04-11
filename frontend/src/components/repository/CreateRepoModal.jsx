import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRepo } from "../../api/repository.api.js";
import Modal from "../common/Modal.jsx";
import Button from "../common/Button.jsx";
import Input from "../common/Input.jsx";
import toast from "react-hot-toast";

const CreateRepoModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "private",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createRepo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      toast.success("Repository created!");
      setFormData({ name: "", description: "", visibility: "private" });
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to create repository");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Repository name is required");
      return;
    }
    mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Repository" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="repo-name"
          label="Name *"
          placeholder="my-awesome-repo"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="repo-desc" className="text-sm font-medium text-gray-300">
            Description
          </label>
          <textarea
            id="repo-desc"
            placeholder="Optional description..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="w-full bg-[#0d1117] border border-[#30363d] hover:border-[#6e7681] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-300">Visibility</label>
          <div className="flex gap-3">
            {["public", "private"].map((v) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={formData.visibility === v}
                  onChange={(e) =>
                    setFormData({ ...formData, visibility: e.target.value })
                  }
                  className="accent-blue-500"
                />
                <span className="text-sm text-gray-300 capitalize">{v}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>
            Create Repository
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRepoModal;
