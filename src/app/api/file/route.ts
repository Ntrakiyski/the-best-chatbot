import { headers } from "next/headers";
import { auth } from "auth/server";
import { fileRepository } from "lib/db/repository";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }

  try {
    const files = await fileRepository.findFilesByProject(
      projectId,
      session.user.id,
    );
    return Response.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return Response.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}
