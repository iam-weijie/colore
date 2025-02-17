import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const id = url.searchParams.get("id");
    //console.log("Received GET request for random posts.");

    // comments table to be joined later :]
    const response = await sql`
      SELECT 
        p.id, 
        p.content, 
        p.like_count, 
        p.report_count, 
        p.created_at,
        p.unread_comments,
        p.recipient_user_id,
        p.pinned,
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
      WHERE p.user_id != ${id} AND p.post_type = 'public'
      ORDER BY RANDOM()
      LIMIT ${number};
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch random posts" }),
      {
        status: 500,
      }
    );
  }
}
