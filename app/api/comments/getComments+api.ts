import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const postId = url.searchParams.get("postId"); // Changed from "id" to "postId"
    const userId = url.searchParams.get("userId");
    const page = parseInt(url.searchParams.get("page") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const offset = page * limit;

    if (!postId) {
      console.error("Missing postId parameter");
      return new Response(
        JSON.stringify({
          error: "Missing postId parameter",
          debug: { postId, userId },
        }),
        { status: 400 }
      );
    }

    const response = await sql.query(
      `
      SELECT 
        c.id, 
        c.post_id,
        u.clerk_id AS user_id,
        c.content, 
        u.firstname,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM friendships f
            WHERE 
              (f.user_id = $1 AND f.friend_id = u.clerk_id)
              OR
              (f.friend_id = $1 AND f.user_id = u.clerk_id)
          ) THEN u.incognito_name
          ELSE u.username
        END AS username,
        c.created_at,
        c.like_count, 
        c.report_count,
        c.notified,
        c.reply_comment_id,
        COALESCE(
          (SELECT TRUE 
           FROM comment_likes cl 
           WHERE cl.comment_id = c.id 
           AND cl.user_id = $1),
          FALSE
        ) as is_liked
      FROM comments c
      JOIN users u ON c.user_id = u.clerk_id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC
      LIMIT ${limit} OFFSET ${offset};
    `;

    // Get total count for pagination
    const countResult = await sql`
      SELECT COUNT(*) as total 
      FROM comments 
      WHERE post_id = ${postId};
    `;
    
    const total = parseInt(countResult[0].total);
    const hasMore = offset + response.length < total;

    return new Response(JSON.stringify({ 
      data: response,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch comments",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
