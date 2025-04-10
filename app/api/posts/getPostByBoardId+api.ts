import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const boardId = url.searchParams.get("id");

    //console.log("Received GET request for user posts.");

    const response = await sql`
      SELECT 
      p.id, 
      p.content, 
      u.firstname,
      p.created_at,
      p.like_count, 
      p.report_count,
      p.unread_comments,
      p.pinned,
      p.board_id,
      p.color,
      p.emoji,
      p.recipient_user_id
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      JOIN boards b ON p.board_id = b.id
      WHERE p.board_id = ${boardId}
      ORDER BY p.created_at ASC;
      `;

      console.log("res", response)
    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch board posts." }),
      {
        status: 500,
      }
    );
  }
}
