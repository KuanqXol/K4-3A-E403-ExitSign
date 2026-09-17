// POST /api/turn — one learner turn through the real LLM pipeline (single JSON response).
import { handleTurn, type TurnRequest } from "../../../engine/web-turn.ts";

export async function POST(request: Request): Promise<Response> {
  let body: TurnRequest;
  try {
    body = (await request.json()) as TurnRequest;
  } catch {
    return Response.json({ success: false, data: null, error: "Body phải là JSON" }, { status: 400 });
  }
  const result = await handleTurn(body);
  return Response.json(result.body, { status: result.status });
}
