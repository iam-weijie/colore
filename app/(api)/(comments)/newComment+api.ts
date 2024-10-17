import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log("Received POST request.");
    const { clerkId, postId, content } = await request.json();

    const response = await sql`
      INSERT INTO comments (user_id, post_id, content)
      VALUES (${clerkId}, ${postId}, ${content})
      ;
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
