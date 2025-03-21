import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    //console.log("Received POST request for new comment.");

    const { clerkId, postId, postClerkId, content, replyId } = await request.json();

    if (!clerkId || !postId || !postClerkId || !content) {
      //console.log("Missing required fields:", { clerkId, postId, postClerkId, content });
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Only increment unread_comments if the comment is from another user
    if (clerkId !== postClerkId) {
      const response = await sql`
        WITH insert_comment AS (
          INSERT INTO comments (user_id, post_id, content, reply_comment_id)
          VALUES (${clerkId}, ${postId}, ${content}, ${replyId})
          RETURNING id
        )
        UPDATE posts
        SET unread_comments = unread_comments + 1
        WHERE id = ${postId}
        RETURNING (SELECT id FROM insert_comment) AS comment_id;
      `;
      return new Response(JSON.stringify({ data: response }), {
        status: 201,
      });
    } else {
      // If the post owner is commenting, don't increment unread_comments
      const response = await sql`
        INSERT INTO comments (user_id, post_id, content, reply_comment_id)
        VALUES (${clerkId}, ${postId}, ${content}, ${replyId})
        RETURNING id;
      `;
      return new Response(JSON.stringify({ data: response }), {
        status: 201,
      });
    }
  } catch (error) {
    console.error("Error creating comment:", error);
    return Response.json(
      {
        error: "Failed to create comment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
