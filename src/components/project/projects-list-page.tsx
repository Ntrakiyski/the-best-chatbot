"use client";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { ArrowUpRight, FolderOpen, Archive } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Skeleton } from "ui/skeleton";
import { BackgroundPaths } from "ui/background-paths";
import { useProjects } from "@/hooks/queries/use-projects";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Badge } from "ui/badge";

export default function ProjectsListPage() {
  const t = useTranslations();
  const router = useRouter();
  const { activeProjects, isLoading } = useProjects();

  return (
    <div className="w-full flex flex-col gap-4 p-8">
      <div className="flex flex-row gap-2 items-center">
        <h1 className="text-2xl font-bold">
          {t("Project.projects") || "Projects"}
        </h1>
      </div>

      {/* Projects Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {t("Project.myProjects") || "My Projects"}
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Create Project Card */}
          <CreateProjectModal>
            <Card
              className="relative bg-secondary overflow-hidden w-full hover:bg-input transition-colors h-[196px] cursor-pointer"
              data-testid="create-project-card"
            >
              <div className="absolute inset-0 w-full h-full opacity-50">
                <BackgroundPaths />
              </div>
              <CardHeader>
                <CardTitle>
                  <h1 className="text-lg font-bold">
                    {t("Project.createProject") || "Create Project"}
                  </h1>
                </CardTitle>
                <CardDescription className="mt-2">
                  <p className="">
                    {t("Project.createProjectDescription") ||
                      "Start a new project with versions and deliverables"}
                  </p>
                </CardDescription>
                <div className="mt-auto ml-auto flex-1">
                  <Button variant="ghost" size="lg">
                    {t("Common.create") || "Create"}
                    <ArrowUpRight className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </CreateProjectModal>

          {/* Loading Skeletons */}
          {isLoading
            ? Array(6)
                .fill(null)
                .map((_, index) => (
                  <Skeleton key={index} className="w-full h-[196px]" />
                ))
            : /* Project Cards */
              activeProjects?.map((project) => (
                <Card
                  key={project.id}
                  className="relative overflow-hidden w-full hover:bg-accent transition-colors h-[196px] cursor-pointer group"
                  onClick={() => router.push(`/projects/${project.id}`)}
                  data-testid={`project-card-${project.id}`}
                >
                  <CardHeader className="flex flex-col h-full">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {project.name}
                        </CardTitle>
                        {project.isArchived && (
                          <Badge
                            variant="secondary"
                            className="mt-1 text-xs"
                            data-testid={`archived-badge-${project.id}`}
                          >
                            <Archive className="size-3 mr-1" />
                            {t("Common.archived") || "Archived"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {project.description && (
                      <CardDescription className="mt-2 line-clamp-2 text-sm">
                        {project.description}
                      </CardDescription>
                    )}

                    {/* Tech Stack */}
                    {project.techStack && project.techStack.length > 0 && (
                      <div className="mt-auto flex flex-wrap gap-1.5">
                        {project.techStack.slice(0, 3).map((tech, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                            data-testid={`tech-badge-${tech}`}
                          >
                            {tech}
                          </Badge>
                        ))}
                        {project.techStack.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground"
                          >
                            +{project.techStack.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* View Button on Hover */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm">
                        {t("Common.view") || "View"}
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
        </div>

        {/* Empty State */}
        {!isLoading && activeProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("Project.noProjects") || "No projects yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("Project.noProjectsDescription") ||
                "Create your first project to get started"}
            </p>
            <CreateProjectModal>
              <Button>{t("Project.createProject") || "Create Project"}</Button>
            </CreateProjectModal>
          </div>
        )}
      </div>
    </div>
  );
}
