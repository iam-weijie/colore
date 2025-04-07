import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const user_id = url.searchParams.get("user_id");

    if (!user_id ) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { status: 400 }
      );
    }

    const query = `
      SELECT 
      b.id,
      b.title,
      b.members_id,
      b.user_id,
      b.board_type,
      b.created_at,
      FROM boards b
      JOIN users u ON p.user_id = u.clerk_id
      WHERE b.user_id = '${user_id}'
      ORDER BY b.created_at ASC;
    `;
   
    const response = await sql(query);
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
