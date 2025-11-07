import { getSession } from "@/lib/auth/server";
import { chatRepository } from "@/lib/db/repository";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/thread/[id]/messages
 * Retrieves messages for a thread with optional filtering by modality
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get thread ID from params
    const { id: threadId } = await params;

    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 },
      );
    }

    // 3. Verify thread ownership
    const hasAccess = await chatRepository.checkAccess(
      threadId,
      session.user.id,
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const modality = searchParams.get("modality") as "voice" | "text" | null;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // 5. Fetch messages
    let messages = await chatRepository.selectMessagesByThreadId(threadId);

    // Filter by modality if specified
    if (modality) {
      messages = messages.filter((msg) => {
        const metadata = msg.metadata as any;
        return metadata?.modality === modality;
      });
    }

    // Apply limit (take most recent N messages)
    if (limit && limit > 0) {
      messages = messages.slice(-limit);
    }

    return NextResponse.json({
      success: true,
      threadId,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
      })),
      count: messages.length,
    });
  } catch (error) {
    console.error("Error fetching thread messages:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
