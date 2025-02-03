import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    //console.log("Received POST request.");
    const { content, clerkId, color = "yellow", emoji } = await request.json();

    const response = await sql`
      INSERT INTO posts (user_id, content, like_count, report_count, color, emoji)
      VALUES (${clerkId}, ${content}, 0, 0, ${color}, ${emoji})
      RETURNING id, color
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
