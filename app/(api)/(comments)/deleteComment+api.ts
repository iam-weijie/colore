import { neon } from "@neondatabase/serverless";

export async function DELETE(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const commentId = url.searchParams.get("id");

    console.log("Received DELETE request for comment.");

    if (!commentId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
      WITH delete_comment AS (
        DELETE FROM comments
        WHERE id = ${commentId}
        RETURNING id, post_id, user_id
      )
      UPDATE posts p
      SET unread_comments = 
        CASE 
          WHEN p.user_id != dc.user_id AND p.unread_comments > 0 
          THEN p.unread_comments - 1 
          ELSE p.unread_comments 
        END
      FROM delete_comment dc
      WHERE p.id = dc.post_id
      RETURNING dc.id, dc.post_id, p.user_id, p.unread_comments;
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to delete comment." }),
      {
        status: 500,
      }
    );
  }
}
