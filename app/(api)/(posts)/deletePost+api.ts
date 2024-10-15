import { neon } from "@neondatabase/serverless";

export async function DELETE(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const postId = url.searchParams.get("id");

    console.log("Received DELETE request for post.");

    const response = await sql`
      DELETE FROM posts WHERE id=${postId}`;
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
