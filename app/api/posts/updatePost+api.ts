import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { content, postId, color, emoji } = await request.json();



    const response = await sql`
      UPDATE posts
      SET 
        content=${content},
        color=${color},
        emoji=${emoji}
      WHERE id=${postId}
      RETURNING *;
    `;

    console.log("updated to", response)
    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
