"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockNoteEditorComponent } from "./BlockNoteEditor";
import { Loader2 } from "lucide-react";

interface FileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name?: string; content?: string }) => Promise<void>;
  mode: "create" | "edit";
  initialName?: string;
  initialContent?: string;
}

export function FileEditor({
  isOpen,
  onClose,
  onSave,
  mode,
  initialName = "",
  initialContent = "",
}: FileEditorProps) {
  const t = useTranslations();
  const [name, setName] = useState(initialName);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setContent(initialContent);
    }
  }, [isOpen, initialName, initialContent]);

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        content: content,
      });
      onClose();
    } catch (error) {
      console.error("Error saving file:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("File.createFile") : t("File.editFile")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("File.createFileDescription")
              : t("File.editFileDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* File Name Input */}
          <div className="space-y-2">
            <Label htmlFor="file-name">{t("File.fileName")}</Label>
            <Input
              id="file-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("File.fileNamePlaceholder")}
              data-testid="file-name-input"
            />
          </div>

          {/* BlockNote Editor */}
          <div className="flex-1 overflow-hidden border rounded-md">
            <BlockNoteEditorComponent
              initialContent={content}
              onSave={handleContentChange}
              placeholder={t("File.contentPlaceholder")}
              className="h-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            data-testid="file-cancel-button"
          >
            {t("File.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            data-testid="file-save-button"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("File.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
