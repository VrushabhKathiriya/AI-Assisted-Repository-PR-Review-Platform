import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addComment } from "../../api/comment.api.js";
import Button from "../common/Button.jsx";
import toast from "react-hot-toast";
import { Send } from "lucide-react";

const CommentForm = ({ prId }) => {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => addComment(prId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", prId] });
      setText("");
      toast.success("Comment added!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to add comment");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    mutate({ text });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        id="comment-input"
        placeholder="Leave a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full bg-[#0d1117] border border-[#30363d] hover:border-[#6e7681] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-colors resize-none"
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isPending}
          disabled={!text.trim() || isPending}
        >
          <Send className="w-3.5 h-3.5" />
          Comment
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;
