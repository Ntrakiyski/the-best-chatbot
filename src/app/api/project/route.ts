import { getSession } from "auth/server";
import { projectRepository } from "lib/db/repository";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json([]);
  }
  const projects = await projectRepository.findProjectsByUserId(
    session.user.id,
  );
  return Response.json(projects);
}
