"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MoreVertical, Plus, Trash2, Edit } from "lucide-react";
import type { ProjectFile } from "app-types/file";
import { formatDistanceToNow } from "date-fns";
import { FileEditor } from "./FileEditor";

interface FileListProps {
  files: ProjectFile[];
  isLoading: boolean;
  onCreateFile: (data: { name: string; content?: string }) => Promise<void>;
  onUpdateFile: (
    fileId: string,
    data: { name?: string; content?: string },
  ) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
  readOnly?: boolean;
}

export function FileList({
  files,
  isLoading,
  onCreateFile,
  onUpdateFile,
  onDeleteFile,
  readOnly = false,
}: FileListProps) {
  const t = useTranslations();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<ProjectFile | null>(null);

  const handleCreate = async (data: { name?: string; content?: string }) => {
    if (!data.name) return;
    await onCreateFile(data);
    setIsCreateModalOpen(false);
  };

  const handleEdit = async (data: { name?: string; content?: string }) => {
    if (!editingFile) return;
    await onUpdateFile(editingFile.id, data);
    setEditingFile(null);
  };

  const handleDelete = async (fileId: string) => {
    if (confirm(t("File.confirmDelete"))) {
      await onDeleteFile(fileId);
    }
  };

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-center py-8">
        {t("File.loadingFiles")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create File Button */}
      {!readOnly && (
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full"
          variant="outline"
          data-testid="create-file-button"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("File.createFile")}
        </Button>
      )}

      {/* File List */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t("File.noFiles")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card
              key={file.id}
              className="hover:bg-accent/50 transition-colors"
              data-testid={`file-card-${file.id}`}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setEditingFile(file)}
                        className="font-medium text-left hover:underline truncate block w-full"
                        data-testid={`file-name-${file.id}`}
                      >
                        {file.name}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        {t("File.updatedAgo", {
                          time: formatDistanceToNow(new Date(file.updatedAt), {
                            addSuffix: true,
                          }),
                        })}
                      </p>
                    </div>
                  </div>

                  {!readOnly && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`file-menu-${file.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingFile(file)}
                          data-testid={`edit-file-${file.id}`}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {t("File.editFile")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(file.id)}
                          className="text-destructive"
                          data-testid={`delete-file-${file.id}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("File.deleteFile")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Create File Modal */}
      <FileEditor
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
        mode="create"
      />

      {/* Edit File Modal */}
      {editingFile && (
        <FileEditor
          isOpen={!!editingFile}
          onClose={() => setEditingFile(null)}
          onSave={handleEdit}
          mode="edit"
          initialName={editingFile.name}
          initialContent={editingFile.content}
        />
      )}
    </div>
  );
}
