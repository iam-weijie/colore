import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);

    const response = await sql`
      SELECT 
        b.id,
        b.title,
        b.members_id,
        b.user_id,
        b.board_type,
        b.created_at
      FROM boards b
      JOIN users u ON b.user_id = u.clerk_id
      WHERE b.restrictions @> '{"Everyone"}'::text[]
      ORDER BY b.created_at ASC
      LIMIT 20;
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  
  } catch (error) {
    console.error("Error fetching boards:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch boards" }),
      { status: 500 }
    );
  }
}