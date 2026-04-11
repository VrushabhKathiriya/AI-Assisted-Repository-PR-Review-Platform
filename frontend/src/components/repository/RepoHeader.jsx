import { Link, useNavigate } from "react-router-dom";
import {
  GitBranch,
  Settings,
  Users,
  BarChart2,
  Lock,
  Globe,
  Trash2,
} from "lucide-react";
import Button from "../common/Button.jsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRepo } from "../../api/repository.api.js";
import toast from "react-hot-toast";

const RepoHeader = ({ repo }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: handleDelete, isPending } = useMutation({
    mutationFn: () => deleteRepo(repo._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repos"] });
      toast.success("Repository deleted");
      navigate("/repos");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to delete repository");
    },
  });

  const confirmDelete = () => {
    if (window.confirm(`Delete "${repo.name}"? This cannot be undone.`)) {
      handleDelete();
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 rounded-lg border border-blue-600/20">
            <GitBranch className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-100">{repo.name}</h1>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                  repo.visibility === "private"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    : "bg-green-500/10 text-green-400 border-green-500/20"
                }`}
              >
                {repo.visibility === "private" ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Globe className="w-3 h-3" />
                )}
                {repo.visibility}
              </span>
            </div>
            {repo.description && (
              <p className="text-sm text-gray-500 mt-0.5">{repo.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to={`/repos/${repo._id}/contributors`}>
            <Button variant="secondary" size="sm">
              <Users className="w-3.5 h-3.5" />
              Contributors
            </Button>
          </Link>
          <Link to={`/stats/${repo._id}`}>
            <Button variant="secondary" size="sm">
              <BarChart2 className="w-3.5 h-3.5" />
              Stats
            </Button>
          </Link>
          <Link to={`/repos/${repo._id}/settings`}>
            <Button variant="secondary" size="sm">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={confirmDelete}
            loading={isPending}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RepoHeader;
