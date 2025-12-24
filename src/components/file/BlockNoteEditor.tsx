"use client";

import { useEffect, useMemo, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import type { PartialBlock } from "@blocknote/core";
import { useTheme } from "next-themes";

interface BlockNoteEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  editorRef?: React.MutableRefObject<any>;
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
  editorRef,
}: BlockNoteEditorProps) {
  const { resolvedTheme } = useTheme();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingContent = useRef(false);
  const blockNoteEditorRef = useRef<any>(null);

  // Expose editor instance to parent if ref is provided
  useEffect(() => {
    if (editorRef && blockNoteEditorRef.current) {
      editorRef.current = blockNoteEditorRef.current;
    }
  }, [editorRef]);

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

  // Store editor reference
  blockNoteEditorRef.current = editor;

  // Handle content changes with debounced save
  useEffect(() => {
    if (!editor || readOnly || !onSave) {
      return;
    }

    const handleChange = () => {
      // Skip saving if we're programmatically updating content
      if (isUpdatingContent.current) {
        return;
      }

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

  // Handle content updates from parent (when initialContent changes)
  useEffect(() => {
    if (!editor || !initialContent) {
      return;
    }

    try {
      // Set flag to prevent save callback during programmatic update
      isUpdatingContent.current = true;

      // Parse the new content
      let newBlocks: PartialBlock[];
      try {
        const parsed = JSON.parse(initialContent);
        newBlocks = parsed as PartialBlock[];
      } catch {
        newBlocks = [
          {
            type: "paragraph" as const,
            content: initialContent,
          },
        ] as PartialBlock[];
      }

      // Update editor content
      editor.replaceBlocks(editor.document, newBlocks);
    } catch (error) {
      console.error("Error updating editor content:", error);
    } finally {
      // Reset flag after update
      isUpdatingContent.current = false;
    }
  }, [editor, initialContent]);

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
