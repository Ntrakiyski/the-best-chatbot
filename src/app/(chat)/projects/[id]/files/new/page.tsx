"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileEditorHeader } from "@/components/file/FileEditorHeader";
import {
  FileEditorContent,
  type FileEditorContentRef,
} from "@/components/file/FileEditorContent";
import { createFileAction } from "@/app/api/file/actions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface NewFilePageProps {
  params: Promise<{ id: string }>;
}

export default function NewFilePage({ params }: NewFilePageProps) {
  return <NewFilePageClient params={params} />;
}

function NewFilePageClient({ params }: NewFilePageProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isSaving, setIsSaving] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [fileData, setFileData] = useState({
    name: "",
    content: "",
    isDirty: false,
  });
  const fileEditorRef = useRef<FileEditorContentRef>(null);

  // Unwrap params
  useState(() => {
    params.then((p) => setProjectId(p.id));
  });

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

    if (!projectId) {
      toast.error("Project ID not found");
      return;
    }

    setIsSaving(true);
    try {
      // Get current content from editor if available
      let currentContent = fileData.content;
      if (fileEditorRef.current?.getCurrentContent) {
        currentContent = fileEditorRef.current.getCurrentContent();
      }

      await createFileAction({
        projectId,
        name: fileData.name.trim(),
        content: currentContent,
      });

      toast.success(t("File.fileSaved"));
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error("Error creating file:", error);
      toast.error("Failed to create file");
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
  useState(() => {
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
  });

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t("Common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <FileEditorHeader
        fileName={fileData.name || t("File.newFile")}
        mode="create"
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={handleCancel}
        canSave={!!fileData.name.trim()}
        projectId={projectId}
      />
      <div className="flex-1 overflow-hidden">
        <FileEditorContent
          ref={fileEditorRef}
          mode="create"
          initialName=""
          initialContent=""
          onContentChange={handleContentChange}
          className="h-full"
        />
      </div>
    </div>
  );
}
