import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log("Received POST request for a new post.");
    const { content, clerkId } = await request.json();

    const response = await sql`
      INSERT INTO posts (user_id, content, likes_count, report_count)
      VALUES (${clerkId}, ${content}, 0, 0)
      RETURNING id;
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
