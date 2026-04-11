import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateFile } from "../../api/file.api.js";
import Button from "../common/Button.jsx";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

const FileEditor = ({ file, repoId }) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(file?.content || "");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setContent(file?.content || "");
    setIsDirty(false);
  }, [file]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => updateFile(file._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file", file._id] });
      queryClient.invalidateQueries({ queryKey: ["files", repoId] });
      setIsDirty(false);
      toast.success("File saved!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to save file");
    },
  });

  const handleSave = () => {
    mutate({ content });
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]">
        <span className="text-sm font-medium text-gray-300">{file?.name}</span>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isPending}
          loading={isPending}
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </Button>
      </div>
      <textarea
        id="file-editor"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setIsDirty(true);
        }}
        className="w-full h-[500px] bg-[#0d1117] text-gray-200 text-sm font-mono px-4 py-4 focus:outline-none resize-none leading-6"
        spellCheck={false}
        placeholder="// Start writing your code here..."
      />
    </div>
  );
};

export default FileEditor;
