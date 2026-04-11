import { useQuery } from "@tanstack/react-query";
import { getContributors, removeContributor } from "../../api/contributor.api.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, UserMinus, Crown } from "lucide-react";
import { formatDate } from "../../utils/formatDate.js";
import useAuthStore from "../../store/auth.store.js";
import Loader from "../common/Loader.jsx";
import Button from "../common/Button.jsx";
import toast from "react-hot-toast";

const ContributorList = ({ repoId, ownerId }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["contributors", repoId],
    queryFn: () => getContributors(repoId),
    enabled: !!repoId,
  });

  const { mutate: handleRemove } = useMutation({
    mutationFn: (userId) => removeContributor(repoId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contributors", repoId] });
      toast.success("Contributor removed");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to remove contributor");
    },
  });

  const contributors = data?.data?.data || [];

  if (isLoading) return <Loader />;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#30363d]">
        <Users className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-200">
          Contributors ({contributors.length})
        </h3>
      </div>
      {contributors.length === 0 ? (
        <p className="text-sm text-gray-500 px-5 py-4">No contributors yet.</p>
      ) : (
        <div className="divide-y divide-[#21262d]">
          {contributors.map((c) => (
            <div
              key={c._id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {c.user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">
                      {c.user?.username}
                    </span>
                    {c.user?._id === ownerId && (
                      <Crown className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{c.role}</span>
                </div>
              </div>
              {user?._id === ownerId && c.user?._id !== ownerId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(c.user._id)}
                >
                  <UserMinus className="w-3.5 h-3.5 text-red-400" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContributorList;
