import { neon } from "@neondatabase/serverless";

export async function DELETE(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const postId = url.searchParams.get("id");

    //console.log("Received DELETE request for post:", postId);

    if (!postId) {
      return new Response(JSON.stringify({ error: "Missing post ID" }), {
        status: 400,
      });
    }

    await sql`
      DELETE FROM comment_likes
      WHERE comment_id IN (
        SELECT id FROM comments WHERE post_id = ${postId}
      )
    `;

    await sql`
      DELETE FROM post_likes
      WHERE post_id = ${postId}
    `;

    await sql`
      DELETE FROM comments
      WHERE post_id = ${postId}
    `;

    const response = await sql`
      DELETE FROM posts
      WHERE id = ${postId}
      RETURNING id
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete post.",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
