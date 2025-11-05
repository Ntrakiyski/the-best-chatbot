"use client";
import useSWR, { SWRConfiguration } from "swr";
import { fetcher } from "lib/utils";
import { Project, ProjectWithVersions } from "app-types/project";
import { handleErrorWithToast } from "ui/shared-toast";
import { authClient } from "auth/client";

/**
 * Hook to fetch all projects for the current user
 */
export function useProjects(options: SWRConfiguration = {}) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const {
    data: projects = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Project[]>("/api/project", fetcher, {
    errorRetryCount: 0,
    revalidateOnFocus: false,
    fallbackData: [],
    onError: handleErrorWithToast,
    ...options,
  });

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
