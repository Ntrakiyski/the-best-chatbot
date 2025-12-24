"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockNoteEditorComponent } from "./BlockNoteEditor";

interface FileEditorContentProps {
  mode: "create" | "edit";
  initialName?: string;
  initialContent?: string;
  onContentChange?: (data: {
    name: string;
    content: string;
    isDirty: boolean;
  }) => void;
  className?: string;
}

export function FileEditorContent({
  initialName = "",
  initialContent = "",
  onContentChange,
  className = "",
}: FileEditorContentProps) {
  const t = useTranslations();
  const [name, setName] = useState(initialName);
  const [content, setContent] = useState(initialContent);
  const blockNoteEditorRef = useRef<any>(null);

  // Track if content has changed from initial values
  const isDirty = name !== initialName || content !== initialContent;

  // Reset state when initial values change
  useEffect(() => {
    setName(initialName);
    setContent(initialContent);
  }, [initialName, initialContent]);

  // Notify parent of changes
  useEffect(() => {
    if (onContentChange) {
      onContentChange({ name, content, isDirty });
    }
  }, [name, content, isDirty, onContentChange]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  // Method to get current content (can be called by parent)
  const getCurrentContent = (): string => {
    if (blockNoteEditorRef.current) {
      try {
        const blocks = blockNoteEditorRef.current.document;
        return JSON.stringify(blocks);
      } catch (_error) {
        console.warn(
          "Could not get current editor content, using state content",
        );
      }
    }
    return content;
  };

  // Expose methods to parent via ref if needed
  useEffect(() => {
    if (blockNoteEditorRef.current) {
      blockNoteEditorRef.current.getCurrentContent = getCurrentContent;
    }
  }, [content]);

  return (
    <div className={`flex flex-col h-full gap-4 p-6 ${className}`}>
      {/* File Name Input */}
      <div className="space-y-2">
        <Label htmlFor="file-name">{t("File.fileName")}</Label>
        <Input
          id="file-name"
          value={name}
          onChange={handleNameChange}
          placeholder={t("File.fileNamePlaceholder")}
          data-testid="file-name-input"
          className="max-w-2xl"
        />
      </div>

      {/* BlockNote Editor */}
      <div className="flex-1 overflow-hidden border rounded-md">
        <BlockNoteEditorComponent
          initialContent={content}
          onSave={handleContentChange}
          placeholder={t("File.contentPlaceholder")}
          className="h-full"
          editorRef={blockNoteEditorRef}
        />
      </div>
    </div>
  );
}

// Export a hook to use with the component for getting current state
export function useFileEditorContent(editorRef: React.RefObject<any>) {
  const getCurrentData = () => {
    if (editorRef.current?.getCurrentContent) {
      return {
        content: editorRef.current.getCurrentContent(),
      };
    }
    return null;
  };

  return { getCurrentData };
}
