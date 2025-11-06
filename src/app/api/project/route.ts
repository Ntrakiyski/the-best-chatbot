import { getSession } from "auth/server";
import { projectRepository } from "lib/db/repository";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json([]);
  }

  // Extract archived query param
  const searchParams = request.nextUrl.searchParams;
  const archivedParam = searchParams.get("archived");

  // Convert to boolean | undefined
  let archived: boolean | undefined;
  if (archivedParam === "true") {
    archived = true;
  } else if (archivedParam === "false") {
    archived = false;
  }
  // If archivedParam is null, archived remains undefined (returns all projects)

  const projects = await projectRepository.findProjectsByUserId(
    session.user.id,
    archived,
  );
  return Response.json(projects);
}
