import { sendNotification } from "@/lib/notification";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    const { clerkId, postId, postClerkId, content, replyId } =
      await request.json();

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

      // Dispatching notification to post owner
      const [post, comment, commenter, postOwner] = await Promise.all([
        sql`
          SELECT id, content, created_at, user_id, like_count, report_count, unread_comments, color, post_type, board_id
          FROM posts
          WHERE id = ${postId};
        `,
        sql`
          SELECT id, content AS comment_content, created_at AS comment_created_at, like_count AS comment_like_count, report_count AS comment_report_count, notified
          FROM comments
          WHERE id = ${insertedComment[0].id};
        `,
        sql`
          SELECT firstname, username
          FROM users
          WHERE clerk_id = ${clerkId};
        `,
        sql`
          SELECT firstname, username, push_token
          FROM users
          WHERE clerk_id = ${postClerkId};
        `,
      ]);

      const new_comment = {
        id: comment[0].id,
        comment_content: comment[0].comment_content,
        comment_created_at: comment[0].comment_created_at,
        comment_like_count: comment[0].comment_like_count,
        comment_report_count: comment[0].comment_report_count,
        notified: comment[0].notified,
        commenter_firstname: commenter[0].firstname,
        commenter_username: commenter[0].username,
        is_liked: false,
      };

      const notification = {
        post_id: post[0].id,
        content: post[0].content,
        firstname: postOwner[0].firstname,
        username: postOwner[0].username,
        created_at: post[0].created_at,
        user_id: post[0].user_id,
        like_count: post[0].like_count,
        report_count: post[0].report_count,
        unread_comments: post[0].unread_comments,
        color: post[0].color,
        comments: [new_comment],
      };

      await sendNotification(
        postClerkId,
        "Comments",
        notification,
        new_comment,
        postOwner[0]?.push_token
      );

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
