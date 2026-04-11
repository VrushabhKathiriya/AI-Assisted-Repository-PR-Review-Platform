import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComments, deleteComment } from "../../api/comment.api.js";
import { MessageSquare, Trash2 } from "lucide-react";
import { formatDate } from "../../utils/formatDate.js";
import useAuthStore from "../../store/auth.store.js";
import Loader from "../common/Loader.jsx";
import toast from "react-hot-toast";

const CommentList = ({ prId }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["comments", prId],
    queryFn: () => getComments(prId),
    enabled: !!prId,
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (id) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", prId] });
      toast.success("Comment deleted");
    },
  });

  const comments = data?.data?.data || [];

  if (isLoading) return <Loader />;

  if (comments.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div
          key={comment._id}
          className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {comment.author?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <span className="text-sm font-medium text-gray-200">
                  {comment.author?.username}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
            </div>
            {user?._id === comment.author?._id && (
              <button
                onClick={() => handleDelete(comment._id)}
                className="p-1 text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap pl-9">
            {comment.text}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CommentList;
