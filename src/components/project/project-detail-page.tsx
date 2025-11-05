"use client";
import { useProject } from "@/hooks/queries/use-projects";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Badge } from "ui/badge";
import { Skeleton } from "ui/skeleton";
import {
  ArrowLeft,
  FolderOpen,
  Archive,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { DeliverableStatus } from "app-types/project";

interface ProjectDetailPageProps {
  projectId: string;
}

const statusConfig: Record<
  DeliverableStatus,
  {
    icon: React.ReactNode;
    label: string;
    variant: "default" | "secondary" | "outline";
  }
> = {
  "not-started": {
    icon: <Circle className="size-3" />,
    label: "Not Started",
    variant: "secondary",
  },
  "in-progress": {
    icon: <Clock className="size-3" />,
    label: "In Progress",
    variant: "default",
  },
  done: {
    icon: <CheckCircle2 className="size-3" />,
    label: "Done",
    variant: "outline",
  },
};

export default function ProjectDetailPage({
  projectId,
}: ProjectDetailPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { project, isLoading, error } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full flex flex-col gap-4 p-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/projects")}
          className="w-fit"
        >
          <ArrowLeft className="size-4 mr-2" />
          {t("Common.back") || "Back"}
        </Button>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t("Project.notFound") || "Project not found"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("Project.notFoundDescription") ||
              "The project you're looking for doesn't exist or you don't have access to it."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 p-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/projects")}
          className="w-fit"
          data-testid="back-button"
        >
          <ArrowLeft className="size-4 mr-2" />
          {t("Common.back") || "Back"}
        </Button>
      </div>

      {/* Project Overview Card */}
      <Card data-testid="project-detail-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle
                  className="text-2xl font-bold"
                  data-testid="project-name"
                >
                  {project.name}
                </CardTitle>
                {project.isArchived && (
                  <Badge
                    variant="secondary"
                    className="mt-2"
                    data-testid="archived-badge"
                  >
                    <Archive className="size-3 mr-1" />
                    {t("Common.archived") || "Archived"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {project.description && (
            <CardDescription
              className="mt-4 text-base"
              data-testid="project-description"
            >
              {project.description}
            </CardDescription>
          )}

          {/* Tech Stack */}
          {project.techStack && project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4" data-testid="tech-stack">
              {project.techStack.map((tech, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  data-testid={`tech-badge-${tech}`}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Versions and Deliverables */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {t("Project.versions") || "Versions"}
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        {project.versions && project.versions.length > 0 ? (
          <div className="grid gap-4">
            {project.versions.map((version) => (
              <Card key={version.id} data-testid={`version-card-${version.id}`}>
                <CardHeader>
                  <CardTitle
                    className="text-lg"
                    data-testid={`version-name-${version.id}`}
                  >
                    {version.name}
                  </CardTitle>
                  {version.description && (
                    <CardDescription
                      data-testid={`version-description-${version.id}`}
                    >
                      {version.description}
                    </CardDescription>
                  )}
                </CardHeader>

                {/* Deliverables */}
                {version.deliverables && version.deliverables.length > 0 && (
                  <CardContent>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                      {t("Project.deliverables") || "Deliverables"}
                    </h3>
                    <div className="space-y-2">
                      {version.deliverables.map((deliverable) => {
                        const statusInfo = statusConfig[deliverable.status];
                        return (
                          <div
                            key={deliverable.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                            data-testid={`deliverable-${deliverable.id}`}
                          >
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Badge
                                variant={statusInfo.variant}
                                className="text-xs"
                                data-testid={`deliverable-status-${deliverable.id}`}
                              >
                                {statusInfo.icon}
                                <span className="ml-1">{statusInfo.label}</span>
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <p
                                className="font-medium text-sm"
                                data-testid={`deliverable-name-${deliverable.id}`}
                              >
                                {deliverable.name}
                              </p>
                              {deliverable.description && (
                                <p
                                  className="text-xs text-muted-foreground mt-1"
                                  data-testid={`deliverable-description-${deliverable.id}`}
                                >
                                  {deliverable.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {t("Project.noVersions") ||
                  "No versions yet. Versions will be added in future phases."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
