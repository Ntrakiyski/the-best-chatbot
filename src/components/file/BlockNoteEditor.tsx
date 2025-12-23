"use client";

import { useEffect, useMemo, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import type { Block, BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { useTheme } from "next-themes";

interface BlockNoteEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * BlockNote Editor Component
 * A Notion-style WYSIWYG editor for markdown content
 */
export function BlockNoteEditorComponent({
  initialContent = "",
  onSave,
  readOnly = false,
  className = "",
}: BlockNoteEditorProps) {
  const { resolvedTheme } = useTheme();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse initial content to blocks
  const initialBlocks = useMemo(() => {
    if (!initialContent) {
      return undefined;
    }

    try {
      // Try to parse as JSON blocks first (BlockNote native format)
      const parsed = JSON.parse(initialContent);
      return parsed as PartialBlock[];
    } catch {
      // If not valid JSON, create a simple paragraph block with the text
      return [
        {
          type: "paragraph" as const,
          content: initialContent,
        },
      ] as PartialBlock[];
    }
  }, [initialContent]);

  // Create the editor instance
  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
  });

  // Handle content changes with debounced save
  useEffect(() => {
    if (!editor || readOnly || !onSave) {
      return;
    }

    const handleChange = () => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for debounced save (2 seconds)
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const blocks = editor.document;
          const content = JSON.stringify(blocks);
          onSave(content);
        } catch (error) {
          console.error("Error saving content:", error);
        }
      }, 2000);
    };

    // Subscribe to document changes
    return editor.onChange(handleChange);
  }, [editor, onSave, readOnly]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`blocknote-wrapper ${className}`}>
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        data-testid="blocknote-editor"
      />
    </div>
  );
}
