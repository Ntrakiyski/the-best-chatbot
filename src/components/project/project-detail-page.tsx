"use client";
import { useState } from "react";
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
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { Label } from "ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import {
  ArrowLeft,
  FolderOpen,
  Archive,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Save,
  X,
  Edit2,
} from "lucide-react";
import { DeliverableStatus } from "app-types/project";
import { toast } from "sonner";
import { notify } from "lib/notify";
import {
  updateProjectAction,
  createVersionAction,
  updateVersionAction,
  deleteVersionAction,
  createDeliverableAction,
  updateDeliverableAction,
  updateDeliverableStatusAction,
  deleteDeliverableAction,
} from "@/app/api/project/actions";

interface ProjectDetailPageProps {
  projectId: string;
}

export default function ProjectDetailPage({
  projectId,
}: ProjectDetailPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { project, isLoading, error, mutate } = useProject(projectId);

  // Editing state
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    techStack: [] as string[],
    systemPrompt: "",
  });

  // Version/Deliverable creation state
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [showDeliverableForm, setShowDeliverableForm] = useState<string | null>(
    null,
  );

  // Form state for new version
  const [versionForm, setVersionForm] = useState({
    name: "",
    description: "",
  });

  // Form state for new deliverable
  const [deliverableForm, setDeliverableForm] = useState({
    name: "",
    description: "",
  });

  // Editing version state
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [editVersionForm, setEditVersionForm] = useState({
    name: "",
    description: "",
  });

  // Editing deliverable state
  const [editingDeliverable, setEditingDeliverable] = useState<string | null>(
    null,
  );
  const [editDeliverableForm, setEditDeliverableForm] = useState({
    name: "",
    description: "",
  });

  // Initialize project form when entering edit mode
  const handleEditProject = () => {
    if (!project) return;
    setProjectForm({
      name: project.name,
      description: project.description || "",
      techStack: project.techStack || [],
      systemPrompt: project.systemPrompt || "",
    });
    setIsEditingProject(true);
  };

  // Save project changes
  const handleSaveProject = async () => {
    try {
      await updateProjectAction(projectId, {
        name: projectForm.name,
        description: projectForm.description || undefined,
        techStack: projectForm.techStack,
        systemPrompt: projectForm.systemPrompt || undefined,
      });
      toast.success(t("Projects.projectUpdated"));
      setIsEditingProject(false);
      mutate();
    } catch (_error) {
      toast.error(t("Projects.failedToUpdateProject"));
    }
  };

  // Create version
  const handleCreateVersion = async () => {
    if (!versionForm.name.trim()) {
      toast.error("Validation Error");
      return;
    }

    try {
      await createVersionAction({
        projectId,
        name: versionForm.name,
        description: versionForm.description || undefined,
      });
      toast.success(t("Projects.versionCreated"));
      setShowVersionForm(false);
      setVersionForm({ name: "", description: "" });
      mutate();
    } catch (_error) {
      toast.error(t("Projects.failedToCreateVersion"));
    }
  };

  // Update version
  const handleUpdateVersion = async (versionId: string) => {
    try {
      await updateVersionAction(versionId, {
        name: editVersionForm.name,
        description: editVersionForm.description || undefined,
      });
      toast.success(t("Projects.versionUpdated"));
      setEditingVersion(null);
      mutate();
    } catch (_error) {
      toast.error(t("Projects.failedToUpdateVersion"));
    }
  };

  // Delete version
  const handleDeleteVersion = async (
    versionId: string,
    versionName: string,
  ) => {
    const confirmed = await notify.confirm({
      title: "Delete Version?",
      description: `Are you sure you want to delete "${versionName}"? All deliverables will also be deleted.`,
    });

    if (confirmed) {
      try {
        await deleteVersionAction(versionId);
        toast.success(t("Projects.versionDeleted"));
        mutate();
      } catch (_error) {
        toast.error(t("Projects.failedToDeleteVersion"));
      }
    }
  };

  // Create deliverable
  const handleCreateDeliverable = async (versionId: string) => {
    if (!deliverableForm.name.trim()) {
      toast.error("Validation Error");
      return;
    }

    try {
      await createDeliverableAction({
        versionId,
        name: deliverableForm.name,
        description: deliverableForm.description || undefined,
      });
      toast.success(t("Projects.deliverableCreated"));
      setShowDeliverableForm(null);
      setDeliverableForm({ name: "", description: "" });
      mutate();
    } catch (_error) {
      toast.error(t("Projects.failedToCreateDeliverable"));
    }
  };

  // Update deliverable
  const handleUpdateDeliverable = async (deliverableId: string) => {
    try {
      await updateDeliverableAction(deliverableId, {
        name: editDeliverableForm.name,
        description: editDeliverableForm.description || undefined,
      });
      toast.success(t("Projects.deliverableUpdated"));
      setEditingDeliverable(null);
      mutate();
    } catch (_error) {
      toast.error(t("Projects.failedToUpdateDeliverable"));
    }
  };

  // Update deliverable status
  const handleUpdateStatus = async (
    deliverableId: string,
    status: DeliverableStatus,
  ) => {
    try {
      await updateDeliverableStatusAction(deliverableId, status);
      toast.success(t("Projects.statusUpdated"));
      mutate();
    } catch (_error) {
      toast.error(t("Projects.failedToUpdateStatus"));
    }
  };

  // Delete deliverable
  const handleDeleteDeliverable = async (
    deliverableId: string,
    deliverableName: string,
  ) => {
    const confirmed = await notify.confirm({
      title: "Delete Deliverable?",
      description: `Are you sure you want to delete "${deliverableName}"?`,
    });

    if (confirmed) {
      try {
        await deleteDeliverableAction(deliverableId);
        toast.success(t("Projects.deliverableDeleted"));
        mutate();
      } catch (_error) {
        toast.error(t("Projects.failedToDeleteDeliverable"));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-4 p-4 md:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full flex flex-col gap-4 p-4 md:p-8">
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

  const isArchived = project.isArchived;

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-8">
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

      {/* Archived Warning */}
      {isArchived && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <Archive className="size-4 inline mr-2" />
              {t("Projects.editingDisabled") ||
                "Editing is disabled for archived projects"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Project Overview Card */}
      <Card data-testid="project-detail-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                {isEditingProject ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="project-name">
                        {t("Projects.projectName") || "Project Name"}
                      </Label>
                      <Input
                        id="project-name"
                        value={projectForm.name}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter project name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-description">
                        {t("Projects.projectDescription") || "Description"}
                      </Label>
                      <Textarea
                        id="project-description"
                        value={projectForm.description}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter project description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="system-prompt">
                        {t("Projects.systemPrompt") ||
                          "Custom AI System Prompt (XML)"}
                      </Label>
                      <Textarea
                        id="system-prompt"
                        value={projectForm.systemPrompt}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            systemPrompt: e.target.value,
                          })
                        }
                        placeholder="Enter custom XML instructions for AI context (optional)"
                        rows={6}
                        className="font-mono text-sm"
                        data-testid="system-prompt-input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("Projects.systemPromptHelp") ||
                          "Custom XML prompt to guide AI behavior when this project is mentioned in chat"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProject}
                        size="sm"
                        data-testid="save-project-button"
                      >
                        <Save className="size-4 mr-2" />
                        {t("Projects.saveChanges") || "Save Changes"}
                      </Button>
                      <Button
                        onClick={() => setIsEditingProject(false)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="size-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <CardTitle
                        className="text-2xl font-bold"
                        data-testid="project-name"
                      >
                        {project.name}
                      </CardTitle>
                      {!isArchived && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleEditProject}
                          data-testid="edit-project-button"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                      )}
                    </div>
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
                    {project.description && (
                      <CardDescription
                        className="mt-4 text-base"
                        data-testid="project-description"
                      >
                        {project.description}
                      </CardDescription>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          {!isEditingProject &&
            project.techStack &&
            project.techStack.length > 0 && (
              <div
                className="flex flex-wrap gap-2 mt-4"
                data-testid="tech-stack"
              >
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
            {t("Projects.versions") || "Versions"}
          </h2>
          <div className="flex-1 h-px bg-border" />
          {!isArchived && (
            <Button
              onClick={() => setShowVersionForm(!showVersionForm)}
              size="sm"
              data-testid="add-version-button"
            >
              <Plus className="size-4 mr-2" />
              {t("Projects.addVersion") || "Add Version"}
            </Button>
          )}
        </div>

        {/* New Version Form */}
        {showVersionForm && (
          <Card className="border-primary/50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="version-name">
                    {t("Projects.versionName") || "Version Name"}
                  </Label>
                  <Input
                    id="version-name"
                    value={versionForm.name}
                    onChange={(e) =>
                      setVersionForm({ ...versionForm, name: e.target.value })
                    }
                    placeholder="e.g., V1.0"
                  />
                </div>
                <div>
                  <Label htmlFor="version-description">
                    {t("Projects.versionDescription") || "Description"}
                  </Label>
                  <Textarea
                    id="version-description"
                    value={versionForm.description}
                    onChange={(e) =>
                      setVersionForm({
                        ...versionForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateVersion} size="sm">
                    <Save className="size-4 mr-2" />
                    Create Version
                  </Button>
                  <Button
                    onClick={() => {
                      setShowVersionForm(false);
                      setVersionForm({ name: "", description: "" });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {project.versions && project.versions.length > 0 ? (
          <div className="grid gap-4">
            {project.versions.map((version) => (
              <Card key={version.id} data-testid={`version-card-${version.id}`}>
                <CardHeader>
                  {editingVersion === version.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Version Name</Label>
                        <Input
                          value={editVersionForm.name}
                          onChange={(e) =>
                            setEditVersionForm({
                              ...editVersionForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={editVersionForm.description}
                          onChange={(e) =>
                            setEditVersionForm({
                              ...editVersionForm,
                              description: e.target.value,
                            })
                          }
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateVersion(version.id)}
                          size="sm"
                        >
                          <Save className="size-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingVersion(null)}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
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
                      </div>
                      {!isArchived && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditVersionForm({
                                name: version.name,
                                description: version.description || "",
                              });
                              setEditingVersion(version.id);
                            }}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() =>
                              handleDeleteVersion(version.id, version.name)
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>

                {/* Deliverables */}
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {t("Projects.deliverables") || "Deliverables"}
                    </h3>
                    {!isArchived && (
                      <Button
                        onClick={() =>
                          setShowDeliverableForm(
                            showDeliverableForm === version.id
                              ? null
                              : version.id,
                          )
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="size-4 mr-2" />
                        Add Deliverable
                      </Button>
                    )}
                  </div>

                  {/* New Deliverable Form */}
                  {showDeliverableForm === version.id && (
                    <Card className="border-primary/50 mb-4">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div>
                            <Label>Deliverable Name</Label>
                            <Input
                              value={deliverableForm.name}
                              onChange={(e) =>
                                setDeliverableForm({
                                  ...deliverableForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="e.g., User Authentication"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={deliverableForm.description}
                              onChange={(e) =>
                                setDeliverableForm({
                                  ...deliverableForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Optional description"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                handleCreateDeliverable(version.id)
                              }
                              size="sm"
                            >
                              Create
                            </Button>
                            <Button
                              onClick={() => {
                                setShowDeliverableForm(null);
                                setDeliverableForm({
                                  name: "",
                                  description: "",
                                });
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {version.deliverables && version.deliverables.length > 0 ? (
                    <div className="space-y-2">
                      {version.deliverables.map((deliverable) => {
                        return (
                          <div
                            key={deliverable.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                            data-testid={`deliverable-${deliverable.id}`}
                          >
                            {editingDeliverable === deliverable.id ? (
                              <div className="flex-1 space-y-3">
                                <div>
                                  <Label>Name</Label>
                                  <Input
                                    value={editDeliverableForm.name}
                                    onChange={(e) =>
                                      setEditDeliverableForm({
                                        ...editDeliverableForm,
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Textarea
                                    value={editDeliverableForm.description}
                                    onChange={(e) =>
                                      setEditDeliverableForm({
                                        ...editDeliverableForm,
                                        description: e.target.value,
                                      })
                                    }
                                    rows={2}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() =>
                                      handleUpdateDeliverable(deliverable.id)
                                    }
                                    size="sm"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    onClick={() => setEditingDeliverable(null)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="min-w-[140px]">
                                  <Select
                                    value={deliverable.status}
                                    onValueChange={(value) =>
                                      handleUpdateStatus(
                                        deliverable.id,
                                        value as DeliverableStatus,
                                      )
                                    }
                                    disabled={isArchived}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="not-started">
                                        <div className="flex items-center gap-2">
                                          <Circle className="size-3" />
                                          Not Started
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="in-progress">
                                        <div className="flex items-center gap-2">
                                          <Clock className="size-3" />
                                          In Progress
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="done">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle2 className="size-3" />
                                          Done
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
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
                                {!isArchived && (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setEditDeliverableForm({
                                          name: deliverable.name,
                                          description:
                                            deliverable.description || "",
                                        });
                                        setEditingDeliverable(deliverable.id);
                                      }}
                                    >
                                      <Edit2 className="size-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() =>
                                        handleDeleteDeliverable(
                                          deliverable.id,
                                          deliverable.name,
                                        )
                                      }
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No deliverables yet
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {t("Project.noVersions") || "No versions yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
