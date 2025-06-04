import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { stackId, sharedById, sharedToId, boardId, message } = await request.json();

    if (!stackId || !sharedById) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: stackId or sharedById" }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    const [response] = await sql`
      INSERT INTO shared_stacks (
        stack_id,
        shared_by_id,
        shared_to_id,
        board_id,
        message
      ) VALUES (
        ${stackId},
        ${sharedById},
        ${sharedToId ?? null},
        ${boardId ?? null},
        ${message ?? null}
      )
      RETURNING *;
    `;

    return new Response(JSON.stringify({ success: true, data: response }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to share stack" }),
      { status: 500 }
    );
  }
}
