"use client";

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
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

export interface FileEditorContentRef {
  getCurrentContent: () => string;
}

export const FileEditorContent = forwardRef<
  FileEditorContentRef,
  FileEditorContentProps
>(
  (
    {
      initialName = "",
      initialContent = "",
      onContentChange,
      className = "",
    }: FileEditorContentProps,
    ref,
  ) => {
    const t = useTranslations();
    const [name, setName] = useState(initialName);
    const [content, setContent] = useState(initialContent);
    const blockNoteEditorRef = useRef<any>(null);

    // Track if content has changed from initial values
    const isDirty = name !== initialName || content !== initialContent;

    // Method to get current content (can be called by parent)
    const getCurrentContent = (): string => {
      console.log("🔍 getCurrentContent called");
      console.log("blockNoteEditorRef.current:", blockNoteEditorRef.current);
      console.log("content state:", content);

      // The blockNoteEditorRef now holds the actual BlockNote editor instance
      // which has a .document property
      if (blockNoteEditorRef.current?.document) {
        try {
          const blocks = blockNoteEditorRef.current.document;
          console.log("✅ Got blocks from editor:", blocks);
          const jsonContent = JSON.stringify(blocks);
          console.log("✅ Stringified content length:", jsonContent.length);
          return jsonContent;
        } catch (error) {
          console.warn(
            "❌ Could not get current editor content, using state content",
            error,
          );
        }
      } else {
        console.warn(
          "⚠️ blockNoteEditorRef.current or .document is null, using state content",
        );
      }
      console.log("📦 Returning content state:", content);
      return content;
    };

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        getCurrentContent,
      }),
      [content],
    );

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
      console.log(
        "📝 handleContentChange called with content length:",
        newContent.length,
      );
      console.log("📝 New content preview:", newContent.substring(0, 100));
      setContent(newContent);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
    };

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
  },
);

FileEditorContent.displayName = "FileEditorContent";
