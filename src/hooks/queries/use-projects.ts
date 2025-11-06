"use client";
import { useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { fetcher } from "lib/utils";
import { Project, ProjectWithVersions } from "app-types/project";
import { handleErrorWithToast } from "ui/shared-toast";
import { authClient } from "auth/client";
import { toast } from "ui/use-toast";
import {
  archiveProjectAction,
  unarchiveProjectAction,
  deleteProjectAction,
} from "@/app/api/project/actions";

/**
 * Hook to fetch all projects for the current user with archive filtering
 */
export function useProjects(options: SWRConfiguration = {}) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const [archived, setArchived] = useState<boolean | undefined>(undefined);

  // Build URL with query params
  const url =
    archived === undefined
      ? "/api/project"
      : `/api/project?archived=${archived}`;

  const {
    data: projects = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Project[]>(url, fetcher, {
    errorRetryCount: 0,
    revalidateOnFocus: false,
    fallbackData: [],
    onError: handleErrorWithToast,
    ...options,
  });

  // Mutation methods
  const archiveProject = async (projectId: string) => {
    try {
      // Optimistic update
      mutate(projects.filter((p) => p.id !== projectId), { revalidate: false });

      await archiveProjectAction(projectId);
      toast({
        title: "Success",
        description: "Project archived successfully",
      });

      // Revalidate to get fresh data
      mutate();
    } catch (error) {
      // Rollback on error
      mutate();
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to archive project",
        variant: "destructive",
      });
    }
  };

  const unarchiveProject = async (projectId: string) => {
    try {
      // Optimistic update
      mutate(projects.filter((p) => p.id !== projectId), { revalidate: false });

      await unarchiveProjectAction(projectId);
      toast({
        title: "Success",
        description: "Project unarchived successfully",
      });

      // Revalidate to get fresh data
      mutate();
    } catch (error) {
      // Rollback on error
      mutate();
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to unarchive project",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      // Optimistic update
      mutate(projects.filter((p) => p.id !== projectId), { revalidate: false });

      await deleteProjectAction(projectId);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      // Revalidate to get fresh data
      mutate();
    } catch (error) {
      // Rollback on error
      mutate();
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  // Client-side filtering for views
  const myProjects = projects.filter(
    (project) => project.userId === currentUserId,
  );
  const archivedProjects = projects.filter((project) => project.isArchived);
  const activeProjects = projects.filter((project) => !project.isArchived);

  return {
    projects, // All projects
    myProjects, // Only user's own projects
    archivedProjects, // Archived projects
    activeProjects, // Active (non-archived) projects
    isLoading,
    error,
    mutate,
    // Archive filter state
    archived,
    setArchived,
    // Mutation methods
    archiveProject,
    unarchiveProject,
    deleteProject,
  };
}

/**
 * Hook to fetch a single project with versions and deliverables
 */
export function useProject(
  projectId: string | null | undefined,
  options: SWRConfiguration = {},
) {
  const {
    data: project,
    error,
    isLoading,
    mutate,
  } = useSWR<ProjectWithVersions>(
    projectId ? `/api/project/${projectId}` : null,
    fetcher,
    {
      errorRetryCount: 0,
      revalidateOnFocus: false,
      onError: handleErrorWithToast,
      ...options,
    },
  );

  return {
    project,
    isLoading,
    error,
    mutate,
  };
}
