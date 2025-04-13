import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    const { clerkId, postId, postClerkId, content, replyId } = await request.json();

    if (!clerkId || !postId || !postClerkId || !content) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // When the comment is from someone other than the post owner
    if (clerkId !== postClerkId) {
      // First insert the comment
      const insertedComment = await sql`
        INSERT INTO comments (user_id, post_id, content, reply_comment_id)
        VALUES (${clerkId}, ${postId}, ${content}, ${replyId})
        RETURNING id;
      `;

      // Then increment the unread_comments counter
      await sql`
        UPDATE posts
        SET unread_comments = unread_comments + 1
        WHERE id = ${postId};
      `;

      return new Response(JSON.stringify({ data: insertedComment[0] }), {
        status: 201,
      });
    } 
    // When the post owner comments on their own post
    else {
      const response = await sql`
        INSERT INTO comments (user_id, post_id, content, reply_comment_id, notified)
        VALUES (${clerkId}, ${postId}, ${content}, ${replyId}, true)
        RETURNING id;
      `;
      return new Response(JSON.stringify({ data: response[0] }), {
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