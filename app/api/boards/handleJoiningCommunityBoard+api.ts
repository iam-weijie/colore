import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerkId, boardId, isJoining } = await request.json();

    // console.log("post id", postId, typeof postId);
    if (!clerkId) {
      return new Response(JSON.stringify({ error: "Missing User Id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("yolooooo")

    // Execute the SQL update query

    const updateBoardMembership = !isJoining

      ? sql`
    UPDATE boards
    SET members_id = ARRAY_REMOVE(members_id, ${clerkId})
    WHERE id = ${boardId}
    AND user_id != ${clerkId}
    RETURNING *;
  `
      : sql`
    UPDATE boards
    SET members_id = ARRAY_APPEND(members_id, ${clerkId})
    WHERE id = ${boardId}
    RETURNING  *;
  `;
    const response = await updateBoardMembership;

    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "Board not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Uservwas added to ${boardId}`,
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
