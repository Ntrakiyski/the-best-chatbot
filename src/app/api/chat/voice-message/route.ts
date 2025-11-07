import { getSession } from "@/lib/auth/session";
import { chatRepository } from "@/lib/db/queries/chat";
import { convertToSavePart } from "@/lib/db/queries/parts";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const VoiceMessageRequestSchema = z.object({
  threadId: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  parts: z.array(z.any()).optional(),
  metadata: z
    .object({
      modality: z.literal("voice"),
      voiceModel: z.string().optional(),
      voiceVoice: z.string().optional(),
      voiceLanguage: z.string().optional(),
      transcriptionConfidence: z.number().optional(),
      chatModel: z
        .object({
          provider: z.string(),
          model: z.string(),
        })
        .optional(),
      usage: z.any().optional(),
      toolChoice: z.enum(["auto", "none", "manual"]).optional(),
      toolCount: z.number().optional(),
      agentId: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /api/chat/voice-message
 * Persists a voice message to the database with modality tagging
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = VoiceMessageRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { threadId, role, content, parts, metadata } = validation.data;

    // 3. Verify thread ownership
    const hasAccess = await chatRepository.checkAccess(
      threadId,
      session.user.id,
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 4. Prepare message parts (sanitize provider metadata)
    const messageParts = parts || [{ type: "text", text: content }];
    const saveParts = messageParts.map(convertToSavePart);

    // 5. Persist message to database
    const result = await chatRepository.upsertMessage({
      threadId,
      role,
      parts: saveParts,
      metadata: metadata || { modality: "voice" },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: result.id,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error("Error persisting voice message:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
