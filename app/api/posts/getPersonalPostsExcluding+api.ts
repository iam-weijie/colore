import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const recipientId = url.searchParams.get("recipient_id");
    const viewerId = url.searchParams.get("user_id");
    const excludeIds =
      url.searchParams.get("exclude_ids")?.split(",").map(String) || [];

    if (!recipientId || !viewerId) {
      return new Response(
        JSON.stringify({ error: "Missing recipient_id or user_id parameter" }),
        { status: 400 }
      );
    }

    const excludeClause =
      excludeIds.length > 0 ? `AND p.id NOT IN (${excludeIds.join(",")})` : "";

    let query;

    // If viewing own board, show all posts made to your board
    if (recipientId === viewerId) {
      query = sql`
        SELECT 
          p.id, 
          p.content, 
          p.like_count, 
          p.report_count, 
          p.created_at,
          p.unread_comments,
          p.color,
          p.emoji,
          u.clerk_id,
          u.firstname, 
          u.lastname, 
          u.username,
          u.country, 
          u.state, 
          u.city
        FROM posts p
        JOIN users u ON p.user_id = u.clerk_id
        WHERE p.recipient_user_id = ${recipientId}
          AND p.post_type = 'personal'
          ${excludeClause}
        ORDER BY p.created_at DESC
        LIMIT ${number};
      `;
    } else {
      // If viewing someone else's board, only show your posts to their board
      query = sql`
        SELECT 
          p.id, 
          p.content, 
          p.like_count, 
          p.report_count, 
          p.created_at,
          p.unread_comments,
          p.color,
          p.emoji,
          u.clerk_id,
          u.firstname, 
          u.lastname, 
          u.username,
          u.country, 
          u.state, 
          u.city
        FROM posts p
        JOIN users u ON p.user_id = u.clerk_id
        WHERE p.recipient_user_id = ${recipientId}
          AND p.user_id = ${viewerId}
          AND p.post_type = 'personal'
          ${excludeClause}
        ORDER BY p.created_at DESC
        LIMIT ${number};
      `;
    }

    const response = await query;
    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching personal posts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch personal posts" }),
      { status: 500 }
    );
  }
}
