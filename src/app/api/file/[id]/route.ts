import { headers } from "next/headers";
import { auth } from "lib/auth";
import { fileRepository } from "lib/db/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const file = await fileRepository.findFileById(id, session.user.id);

    if (!file) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    return Response.json(file);
  } catch (error) {
    console.error("Error fetching file:", error);
    return Response.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
