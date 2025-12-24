"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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

interface FileListProps {
  projectId: string;
  files: ProjectFile[];
  isLoading: boolean;
  onDeleteFile: (fileId: string) => Promise<void>;
  readOnly?: boolean;
}

export function FileList({
  projectId,
  files,
  isLoading,
  onDeleteFile,
  readOnly = false,
}: FileListProps) {
  const t = useTranslations();
  const router = useRouter();

  const handleCreateClick = () => {
    router.push(`/projects/${projectId}/files/new`);
  };

  const handleEditClick = (fileId: string) => {
    router.push(`/projects/${projectId}/files/${fileId}`);
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
          onClick={handleCreateClick}
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
                        onClick={() => handleEditClick(file.id)}
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
                          onClick={() => handleEditClick(file.id)}
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
    </div>
  );
}
