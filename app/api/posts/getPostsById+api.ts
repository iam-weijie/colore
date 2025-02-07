import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    const response = await sql`
    SELECT 
      p.id, 
      p.content, 
      p.like_count, 
      p.report_count, 
      p.created_at,
      p.unread_comments,
      p.color,
      u.clerk_id,
      u.firstname, 
      u.lastname, 
      u.username,
      u.country, 
      u.state, 
      u.city
    FROM posts p
    JOIN users u ON p.user_id = u.clerk_id 
    WHERE p.id = ${id}
  `;
  
  

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch specific post" }),
      {
        status: 500,
      }
    );
  }
}
