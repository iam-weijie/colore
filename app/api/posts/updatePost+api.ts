import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { content, postId, color, emoji } = await request.json();

    console.log(content, postId, color, emoji);

    const response = await sql`
      UPDATE posts
      SET 
        content=${content},
        color=${color},
        emoji=${emoji}
      WHERE id=${postId}
      RETURNING *;
    `;

    console.log(response)
    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    console.log("yo")
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
