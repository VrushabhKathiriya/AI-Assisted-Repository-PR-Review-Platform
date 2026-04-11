import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteContributor } from "../../api/contributor.api.js";
import Modal from "../common/Modal.jsx";
import Input from "../common/Input.jsx";
import Button from "../common/Button.jsx";
import toast from "react-hot-toast";

const ROLES = ["viewer", "editor", "reviewer"];

const InviteModal = ({ isOpen, onClose, repoId }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ email: "", role: "viewer" });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => inviteContributor(repoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations", repoId] });
      toast.success("Invitation sent!");
      setFormData({ email: "", role: "viewer" });
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to send invitation");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Contributor" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="invite-email"
          label="Email address"
          type="email"
          placeholder="contributor@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-300">Role</label>
          <select
            id="invite-role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full bg-[#0d1117] border border-[#30363d] hover:border-[#6e7681] focus:border-blue-500 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none transition-colors"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>
            Send Invite
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteModal;
