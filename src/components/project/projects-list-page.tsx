"use client";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import {
  ArrowUpRight,
  FolderOpen,
  Archive,
  MoreVertical,
  Trash2,
  ArchiveRestore,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Skeleton } from "ui/skeleton";
import { BackgroundPaths } from "ui/background-paths";
import { useProjects } from "@/hooks/queries/use-projects";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Badge } from "ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { notify } from "lib/notify";

export default function ProjectsListPage() {
  const t = useTranslations();
  const router = useRouter();
  const {
    projects,
    isLoading,
    archived,
    setArchived,
    archiveProject,
    unarchiveProject,
    deleteProject,
  } = useProjects();

  // Handle delete with confirmation
  const handleDelete = async (projectId: string, _projectName: string) => {
    const confirmed = await notify.confirm({
      title: t("Projects.confirmDeleteProject"),
      description: t("Projects.confirmDeleteProjectDescription"),
    });

    if (confirmed) {
      await deleteProject(projectId);
    }
  };

  // Filter projects based on archived state
  const displayProjects = projects.filter((p) =>
    archived === true ? p.isArchived : !p.isArchived,
  );

  return (
    <div className="w-full flex flex-col gap-4 p-4 md:p-8">
      <div className="flex flex-row gap-2 items-center">
        <h1 className="text-xl md:text-2xl font-bold">
          {t("Projects.myProjects") || "My Projects"}
        </h1>
      </div>

      {/* Tabs for Active/Archived */}
      <Tabs
        value={archived === true ? "archived" : "active"}
        onValueChange={(value) => setArchived(value === "archived")}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">
            {t("Projects.activeProjects") || "Active Projects"}
          </TabsTrigger>
          <TabsTrigger value="archived">
            {t("Projects.archivedProjects") || "Archived Projects"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <ProjectsGrid
            projects={displayProjects}
            isLoading={isLoading}
            t={t}
            router={router}
            onArchive={archiveProject}
            onUnarchive={unarchiveProject}
            onDelete={handleDelete}
            showCreate={true}
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <ProjectsGrid
            projects={displayProjects}
            isLoading={isLoading}
            t={t}
            router={router}
            onArchive={archiveProject}
            onUnarchive={unarchiveProject}
            onDelete={handleDelete}
            showCreate={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Separate component for the project grid
function ProjectsGrid({
  projects,
  isLoading,
  t,
  router,
  onArchive,
  onUnarchive,
  onDelete,
  showCreate,
}: {
  projects: any[];
  isLoading: boolean;
  t: any;
  router: any;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  showCreate: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Create Project Card - only show on active tab */}
        {showCreate && (
          <CreateProjectModal>
            <Card
              className="relative bg-secondary overflow-hidden w-full hover:bg-input transition-colors min-h-[196px] cursor-pointer"
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
        )}

        {/* Loading Skeletons */}
        {isLoading
          ? Array(6)
              .fill(null)
              .map((_, index) => (
                <Skeleton key={index} className="w-full h-[196px]" />
              ))
          : /* Project Cards */
            projects?.map((project) => (
              <Card
                key={project.id}
                className="relative overflow-hidden w-full hover:bg-accent transition-colors h-[196px] group"
                data-testid={`project-card-${project.id}`}
              >
                <CardHeader className="flex flex-col h-full">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <FolderOpen className="size-5 text-primary" />
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
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

                    {/* Dropdown Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`project-menu-${project.id}`}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {project.isArchived ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnarchive(project.id);
                            }}
                            data-testid={`unarchive-${project.id}`}
                          >
                            <ArchiveRestore className="size-4 mr-2" />
                            {t("Projects.unarchiveProject") ||
                              "Unarchive Project"}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchive(project.id);
                            }}
                            data-testid={`archive-${project.id}`}
                          >
                            <Archive className="size-4 mr-2" />
                            {t("Projects.archiveProject") || "Archive Project"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(project.id, project.name);
                          }}
                          className="text-destructive focus:text-destructive"
                          data-testid={`delete-${project.id}`}
                        >
                          <Trash2 className="size-4 mr-2" />
                          {t("Projects.deleteProject") || "Delete Project"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div
                    className="cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
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
                  </div>
                </CardHeader>
              </Card>
            ))}
      </div>

      {/* Empty State */}
      {!isLoading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {showCreate
              ? t("Projects.noProjects") || "No projects yet"
              : t("Projects.noArchivedProjects") || "No archived projects"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {showCreate &&
              (t("Projects.createFirstProject") ||
                "Create your first project to get started")}
          </p>
        </div>
      )}
    </div>
  );
}
