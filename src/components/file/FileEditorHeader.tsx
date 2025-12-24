"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface FileEditorHeaderProps {
  fileName: string;
  mode: "create" | "edit";
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  canSave: boolean;
  projectId: string;
}

export function FileEditorHeader({
  fileName,
  mode,
  isSaving,
  onSave,
  onCancel,
  canSave,
  projectId,
}: FileEditorHeaderProps) {
  const t = useTranslations();
  const router = useRouter();

  const handleBack = () => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b bg-background">
      {/* Left side - Back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          disabled={isSaving}
          aria-label={t("File.backToProject")}
          data-testid="file-back-button"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold truncate max-w-md">
            {mode === "create"
              ? t("File.newFile")
              : fileName || t("File.editFile")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {mode === "create"
              ? t("File.createFileDescription")
              : t("File.editFileDescription")}
          </p>
        </div>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          data-testid="file-cancel-button"
        >
          {t("File.cancel")}
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving || !canSave}
          data-testid="file-save-button"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("File.save")}
        </Button>
      </div>
    </header>
  );
}
