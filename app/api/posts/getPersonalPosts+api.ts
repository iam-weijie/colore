import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const recipientId = url.searchParams.get("recipient_id");
    const viewerId = url.searchParams.get("user_id");

    if (!recipientId || !viewerId) {
      return new Response(
        JSON.stringify({ error: "Missing recipient_id or user_id parameter" }),
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        p.id, 
        p.content, 
        p.like_count, 
        p.report_count, 
        p.created_at,
        p.unread_comments,
        p.pinned,
        p.color,
        p.emoji,
        p.board_id,
        p.prompt_id,
        p.recipient_user_id,
        p.unread,
        u.clerk_id,
        u.firstname, 
        u.lastname, 
        u.username,
        u.country, 
        u.state, 
        u.city,
        pr.content as prompt
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      LEFT JOIN prompts pr ON p.prompt_id = pr.id
      WHERE p.recipient_user_id = '${recipientId}'
        AND p.post_type = 'personal'
        AND (p.board_id IS NULL OR p.board_id < 0)
      ORDER BY p.created_at DESC
      LIMIT ${number};
    `;


   
    const response = await sql(query);


   //console.log("personal post", response)
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
