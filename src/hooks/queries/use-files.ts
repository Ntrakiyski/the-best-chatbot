import useSWR, { type SWRConfiguration } from "swr";
import type { ProjectFile } from "app-types/file";
import { toast } from "sonner";
import {
  createFileAction,
  updateFileAction,
  deleteFileAction,
} from "@/app/api/file/actions";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

/**
 * Hook to fetch all files for a project
 */
export function useProjectFiles(
  projectId: string | null | undefined,
  options: SWRConfiguration = {},
) {
  const url = projectId ? `/api/file?projectId=${projectId}` : null;

  const {
    data: files = [],
    error,
    isLoading,
    mutate,
  } = useSWR<ProjectFile[]>(url, fetcher, {
    revalidateOnFocus: false,
    ...options,
  });

  const createFile = async (data: {
    name: string;
    content?: string;
    contentType?: "markdown" | "text";
  }) => {
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    try {
      // Optimistic update
      const tempFile: ProjectFile = {
        id: `temp-${Date.now()}`,
        projectId,
        name: data.name,
        content: data.content || "",
        contentType: data.contentType || "markdown",
        size: new TextEncoder().encode(data.content || "").length,
        userId: "",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mutate([tempFile, ...files], false);

      const newFile = await createFileAction({
        projectId,
        name: data.name,
        content: data.content,
        contentType: data.contentType,
      });

      toast.success("File created successfully");
      mutate();
      return newFile;
    } catch (error) {
      toast.error("Failed to create file");
      mutate();
      throw error;
    }
  };

  const updateFile = async (
    fileId: string,
    data: {
      name?: string;
      content?: string;
    },
  ) => {
    try {
      // Optimistic update
      const updatedFiles = files.map((f) =>
        f.id === fileId
          ? {
              ...f,
              ...data,
              size: data.content
                ? new TextEncoder().encode(data.content).length
                : f.size,
              updatedAt: new Date(),
            }
          : f,
      );

      mutate(updatedFiles, false);

      const updatedFile = await updateFileAction(fileId, data);

      toast.success("File updated successfully");
      mutate();
      return updatedFile;
    } catch (error) {
      toast.error("Failed to update file");
      mutate();
      throw error;
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      // Optimistic update
      mutate(
        files.filter((f) => f.id !== fileId),
        false,
      );

      await deleteFileAction(fileId);

      toast.success("File deleted successfully");
      mutate();
    } catch (error) {
      toast.error("Failed to delete file");
      mutate();
      throw error;
    }
  };

  return {
    files,
    isLoading,
    error,
    mutate,
    createFile,
    updateFile,
    deleteFile,
  };
}

/**
 * Hook to fetch a single file
 */
export function useFile(
  fileId: string | null | undefined,
  options: SWRConfiguration = {},
) {
  const url = fileId ? `/api/file/${fileId}` : null;

  const {
    data: file,
    error,
    isLoading,
    mutate,
  } = useSWR<ProjectFile>(url, fetcher, {
    revalidateOnFocus: false,
    ...options,
  });

  return {
    file,
    isLoading,
    error,
    mutate,
  };
}
