import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { postId, sharedById, sharedToId, boardId, message } = await request.json();

    if (!postId || !sharedById) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: postId or sharedById" }),
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    const [response] = await sql`
      INSERT INTO shared_posts (
        post_id,
        shared_by_id,
        shared_to_id,
        board_id,
        message
      ) VALUES (
        ${postId},
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
      JSON.stringify({ success: false, error: "Failed to share post" }),
      { status: 500 }
    );
  }
}
