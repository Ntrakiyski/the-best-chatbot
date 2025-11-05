"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "ui/dialog";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { Label } from "ui/label";
import { Button } from "ui/button";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useTranslations } from "next-intl";
import { createProjectAction } from "@/app/api/project/actions";

interface CreateProjectModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateProjectModal({
  children,
  open,
  onOpenChange,
}: CreateProjectModalProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    techStack: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse tech stack (comma-separated) into array
      const techStackArray = formData.techStack
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech.length > 0);

      const project = await createProjectAction({
        name: formData.name,
        description: formData.description || undefined,
        techStack: techStackArray.length > 0 ? techStackArray : undefined,
      });

      // Refresh projects list
      mutate("/api/project");

      // Show success message
      toast.success(t("Project.created") || "Project created successfully!");

      // Reset form
      setFormData({ name: "", description: "", techStack: "" });

      // Close modal
      if (onOpenChange) {
        onOpenChange(false);
      }

      // Navigate to new project
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      // Display validation or server errors
      const errorMessage =
        error?.message || t("Common.error") || "An error occurred";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {t("Project.createProject") || "Create Project"}
            </DialogTitle>
            <DialogDescription>
              {t("Project.createProjectDescription") ||
                "Create a new project to organize your work and deliverables."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name Field */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                {t("Common.name") || "Name"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder={
                  t("Project.namePlaceholder") || "My Awesome Project"
                }
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                maxLength={100}
                disabled={isSubmitting}
                data-testid="project-name-input"
              />
            </div>

            {/* Description Field */}
            <div className="grid gap-2">
              <Label htmlFor="description">
                {t("Common.description") || "Description"}{" "}
                <span className="text-muted-foreground text-xs">
                  ({t("Common.optional") || "optional"})
                </span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder={
                  t("Project.descriptionPlaceholder") ||
                  "Describe what this project is about..."
                }
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                maxLength={500}
                disabled={isSubmitting}
                data-testid="project-description-input"
                rows={3}
              />
            </div>

            {/* Tech Stack Field */}
            <div className="grid gap-2">
              <Label htmlFor="techStack">
                {t("Project.techStack") || "Tech Stack"}{" "}
                <span className="text-muted-foreground text-xs">
                  ({t("Common.optional") || "optional"})
                </span>
              </Label>
              <Input
                id="techStack"
                name="techStack"
                placeholder={
                  t("Project.techStackPlaceholder") ||
                  "React, Node.js, PostgreSQL"
                }
                value={formData.techStack}
                onChange={(e) =>
                  setFormData({ ...formData, techStack: e.target.value })
                }
                disabled={isSubmitting}
                data-testid="project-techstack-input"
              />
              <p className="text-xs text-muted-foreground">
                {t("Project.techStackHint") ||
                  "Separate technologies with commas"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              data-testid="project-submit-button"
            >
              {isSubmitting && <Loader className="size-4 animate-spin mr-2" />}
              {isSubmitting
                ? t("Common.creating") || "Creating..."
                : t("Common.create") || "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
