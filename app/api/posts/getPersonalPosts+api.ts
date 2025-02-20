import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const recipientId = url.searchParams.get("recipient_id");
    const userId = url.searchParams.get("user_id");

    // Add this validation
    if (!recipientId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing recipient_id or user_id parameter" }),
        { status: 400 }
      );
    }

    // Ensure they are strings 
    const userIdStr = String(userId);
    const recipientIdStr = String(recipientId);

    const response = await sql`
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
      WHERE (
        (p.user_id = ${userIdStr} AND p.recipient_user_id = ${recipientIdStr})
        OR 
        (p.user_id = ${recipientIdStr} AND p.recipient_user_id = ${userIdStr})
      )
      AND p.post_type = 'personal'
      ORDER BY p.created_at DESC
    `;

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