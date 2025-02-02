import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
    try {
      const sql = neon(`${process.env.DATABASE_URL}`);
      const comment = await request.json();
      const commentId = comment.commentId
      
      if (!commentId) {
        return Response.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      await sql`
      UPDATE comments
      SET notified = TRUE
      WHERE id = ${commentId}
    `;

    } catch (error) {
        console.error(error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch user info" }),
          {
            status: 500,
          }
        );
      }

}