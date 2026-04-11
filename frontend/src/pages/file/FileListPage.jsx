import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getFiles } from "../../api/file.api.js";
import Layout from "../../components/common/Layout.jsx";
import FileCard from "../../components/file/FileCard.jsx";
import Loader from "../../components/common/Loader.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { FileCode } from "lucide-react";

const FileListPage = () => {
  const { repoId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["files", repoId],
    queryFn: () => getFiles(repoId),
    enabled: !!repoId,
  });

  const files = data?.data?.data || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-gray-100 mb-6">Files</h1>
        {isLoading ? (
          <Loader />
        ) : files.length === 0 ? (
          <EmptyState
            icon={FileCode}
            title="No files yet"
            description="No files have been added to this repository."
          />
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {files.map((file) => (
              <FileCard key={file._id} file={file} repoId={repoId} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FileListPage;
