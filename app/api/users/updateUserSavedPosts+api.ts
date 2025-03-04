import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerkId, postId, isSaved } = await request.json();

    // console.log("post id", postId, typeof postId);
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Missing User Id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Execute the SQL update query

    const updateSavePost = isSaved
      ? sql`
    UPDATE users
    SET saved_posts = ARRAY_REMOVE(saved_posts, ${postId})
    WHERE clerk_id = ${clerkId}
    RETURNING *;
  `
      : sql`
    UPDATE users
    SET saved_posts = ARRAY_APPEND(saved_posts, ${postId})
    WHERE clerk_id = ${clerkId}
    RETURNING  *;
  `;
    const response = await updateSavePost;

    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Post ${postId} was added to saved posts`,
        data: response,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update saved posts" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
