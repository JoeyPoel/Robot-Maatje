import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { llmProxyService, ChatMessage } from '@/core/services/LlmProxyService';

const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Bericht mag niet leeg zijn.'),
  history: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = ChatRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Ongeldige invoer', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { message, history, model } = parsed.data;

    const messages: ChatMessage[] = (history || []).map((h) => ({
      role: h.role,
      content: h.content,
    }));

    messages.push({ role: 'user', content: message });

    const result = await llmProxyService.chatWithTools(messages, { model });

    return NextResponse.json({
      success: true,
      reply: result.replyText,
      executedActions: result.executedActions,
      emotion: result.emotion,
    });
  } catch (err: unknown) {
    console.error('[AI Chat Route Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

