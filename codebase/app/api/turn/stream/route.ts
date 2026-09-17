// POST /api/turn/stream — same turn, streamed live as NDJSON:
// one TurnEvent per line while the pipeline runs, then {"type":"result",...} or {"type":"error",...}.
import { handleTurn, type TurnRequest } from "../../../../engine/web-turn.ts";

export async function POST(request: Request): Promise<Response> {
  let body: TurnRequest;
  try {
    body = (await request.json()) as TurnRequest;
  } catch {
    return Response.json({ success: false, data: null, error: "Body phải là JSON" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      const result = await handleTurn(body, send);
      send(result.body.success ? { type: "result", data: result.body.data } : { type: "error", error: result.body.error });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
