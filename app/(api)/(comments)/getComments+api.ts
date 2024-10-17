import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const postId = url.searchParams.get("id");

    console.log("Received GET request for post comments.");

    const response = await sql`
      SELECT 
      c.id, 
      c.content, 
      u.firstname,
      c.created_at,
      c.like_count, 
      c.report_count
      FROM comments c
      JOIN users u ON c.user_id = u.clerk_id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC;
      `;
    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user posts." }),
      {
        status: 500,
      }
    );
  }
}
