import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingInvitations, cancelInvitation } from "../../api/contributor.api.js";
import { Clock, X } from "lucide-react";
import { formatDate } from "../../utils/formatDate.js";
import Loader from "../common/Loader.jsx";
import toast from "react-hot-toast";

const PendingInvitations = ({ repoId }) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pendingInvitations", repoId],
    queryFn: () => getPendingInvitations(repoId),
    enabled: !!repoId,
  });

  const { mutate: handleCancel } = useMutation({
    mutationFn: (id) => cancelInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations", repoId] });
      toast.success("Invitation cancelled");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to cancel invitation");
    },
  });

  const invitations = data?.data?.data || [];

  if (isLoading) return <Loader />;
  if (invitations.length === 0) return null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden mt-4">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#30363d]">
        <Clock className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-gray-200">
          Pending Invitations ({invitations.length})
        </h3>
      </div>
      <div className="divide-y divide-[#21262d]">
        {invitations.map((inv) => (
          <div
            key={inv._id}
            className="flex items-center justify-between px-5 py-3"
          >
            <div>
              <p className="text-sm text-gray-200">{inv.email}</p>
              <p className="text-xs text-gray-500 capitalize">
                {inv.role} · Sent {formatDate(inv.createdAt)}
              </p>
            </div>
            <button
              onClick={() => handleCancel(inv._id)}
              className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Cancel invitation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingInvitations;
