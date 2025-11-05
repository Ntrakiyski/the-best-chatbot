import ProjectDetailPage from "@/components/project/project-detail-page";
import { getSession } from "auth/server";
import { redirect } from "next/navigation";

// Force dynamic rendering to avoid static generation issues with session
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { id } = await params;
  return <ProjectDetailPage projectId={id} />;
}
