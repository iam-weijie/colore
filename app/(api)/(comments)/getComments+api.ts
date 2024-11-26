import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");  // Changed from "id" to "postId"
    const userId = url.searchParams.get("userId");

    if (!postId) {
      console.error("Missing postId parameter");
      return new Response(
        JSON.stringify({ 
          error: "Missing postId parameter",
          debug: { postId, userId }
        }),
        { status: 400 }
      );
    }

    const response = await sql`
      SELECT 
        c.id, 
        c.post_id,
        u.clerk_id AS user_id,
        c.content, 
        u.firstname,
        u.username,
      c.created_at,
        c.like_count, 
        c.report_count,
        COALESCE(
          (SELECT TRUE 
           FROM comment_likes cl 
           WHERE cl.comment_id = c.id 
           AND cl.user_id = ${userId || ''}),
          FALSE
        ) as is_liked
      FROM comments c
      JOIN users u ON c.user_id = u.clerk_id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at DESC;
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch comments",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500 }
    );
  }
}