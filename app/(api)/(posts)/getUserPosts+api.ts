import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("id");

    // comments table to be joined later :]
    const response = await sql`
      SELECT 
      p.id, 
      p.content, 
      p.likes_count, 
      p.report_count,
      u.clerk_id
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      WHERE u.clerk_id = ${clerkId}
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
