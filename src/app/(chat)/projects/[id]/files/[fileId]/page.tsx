"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileEditorHeader } from "@/components/file/FileEditorHeader";
import { FileEditorContent } from "@/components/file/FileEditorContent";
import { updateFileAction } from "@/app/api/file/actions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useFile } from "@/hooks/queries/use-files";

interface EditFilePageProps {
  params: Promise<{ id: string; fileId: string }>;
}

export default function EditFilePage({ params }: EditFilePageProps) {
  return <EditFilePageClient params={params} />;
}

function EditFilePageClient({ params }: EditFilePageProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isSaving, setIsSaving] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [fileId, setFileId] = useState<string>("");
  const [fileData, setFileData] = useState({
    name: "",
    content: "",
    isDirty: false,
  });
  const blockNoteEditorRef = useRef<any>(null);

  // Unwrap params
  useEffect(() => {
    params.then((p) => {
      setProjectId(p.id);
      setFileId(p.fileId);
    });
  }, [params]);

  // Fetch file data
  const { file: currentFile, isLoading, error } = useFile(fileId || undefined);

  // Redirect if file not found
  useEffect(() => {
    if (!isLoading && projectId && fileId && !currentFile) {
      toast.error(t("File.notFound"));
      router.push(`/projects/${projectId}`);
    }
  }, [isLoading, currentFile, projectId, fileId, router, t]);

  const handleContentChange = useCallback(
    (data: { name: string; content: string; isDirty: boolean }) => {
      setFileData(data);
    },
    [],
  );

  const handleSave = async () => {
    if (!fileData.name.trim()) {
      toast.error(
        t("File.fileName") + " " + t("Common.required").toLowerCase(),
      );
      return;
    }

    if (!projectId || !fileId) {
      toast.error("Project ID or File ID not found");
      return;
    }

    setIsSaving(true);
    try {
      // Get current content from editor if available
      let currentContent = fileData.content;
      if (blockNoteEditorRef.current?.getCurrentContent) {
        currentContent = blockNoteEditorRef.current.getCurrentContent();
      }

      await updateFileAction(fileId, {
        name: fileData.name.trim(),
        content: currentContent,
      });

      toast.success(t("File.fileUpdated"));
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error("Error updating file:", error);
      toast.error("Failed to update file");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (fileData.isDirty) {
      const confirmed = confirm(
        t("File.unsavedChanges") + "\n" + t("File.unsavedChangesDescription"),
      );
      if (!confirmed) return;
    }
    router.push(`/projects/${projectId}`);
  };

  // Warn before closing browser tab if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (fileData.isDirty && !isSaving) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [fileData.isDirty, isSaving]);

  // Loading state
  if (isLoading || !projectId || !fileId || !currentFile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">
          {isLoading ? t("File.loadingFiles") : t("Common.loading")}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Error loading file</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <FileEditorHeader
        fileName={fileData.name || currentFile.name}
        mode="edit"
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={handleCancel}
        canSave={!!fileData.name.trim()}
        projectId={projectId}
      />
      <div className="flex-1 overflow-hidden">
        <FileEditorContent
          mode="edit"
          initialName={currentFile.name}
          initialContent={currentFile.content}
          onContentChange={handleContentChange}
          className="h-full"
        />
      </div>
    </div>
  );
}
