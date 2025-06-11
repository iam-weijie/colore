import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  const sql = neon(`${process.env.DATABASE_URL}`);
  try {
    const url = new URL(request.url);
    const commentId = url.searchParams.get("commentId");
    const userId = url.searchParams.get("userId");
    const commentIdNum = parseInt(commentId!, 10);

    if (!commentIdNum || !userId) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
      });
    }

    const result = await sql`
      SELECT 
        c.like_count,
        EXISTS(
          SELECT 1 
          FROM comment_likes cl 
          WHERE cl.comment_id = ${commentIdNum} 
          AND cl.user_id = ${userId}
        ) as is_liked
      FROM comments c
      WHERE c.id = ${commentIdNum}
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Comment not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        data: {
          likeCount: result[0].like_count,
          liked: result[0].is_liked,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Comment like status check error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check like status",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const sql = neon(`${process.env.DATABASE_URL}`);
  try {
    const { commentId, userId, increment } = await request.json();
    const commentIdNum = parseInt(commentId, 10);

    if (!commentIdNum || !userId) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
      });
    }

    let result;

    if (increment) {
      // Like the comment
      result = await sql`
        WITH insert_like AS (
          INSERT INTO comment_likes (user_id, comment_id, unread)
          VALUES (${userId}, ${commentIdNum}, TRUE)
          ON CONFLICT (user_id, comment_id) DO NOTHING
          RETURNING id
        ),
        update_count AS (
          UPDATE comments
          SET like_count = like_count + 
            CASE WHEN EXISTS (SELECT 1 FROM insert_like) THEN 1 ELSE 0 END
          WHERE id = ${commentIdNum}
          RETURNING like_count
        )
        SELECT 
          uc.like_count,
          TRUE as is_liked,
          il.id as like_id
        FROM update_count uc
        LEFT JOIN insert_like il ON true
      `;

      // Dispatching notification of liking comment to comment owner
      // Refactor: turn 2 sql queries into 1

      const commentInfo = await sql`
        SELECT
          id,
          post_id,
          user_id,
          content
        FROM comments 
        WHERE id = ${commentIdNum}
      `;

      const likerUsername = await sql`
        SELECT 
          username
        FROM users
        WHERE clerk_id = ${userId}
      `;

      // don't send a notification if someone likes their own comment
      if (commentInfo[0].user_id !== userId) {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_SERVER_URL}/dispatch`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: commentInfo[0].user_id,
              type: "Likes",
              notification: {
                id: result[0].like_id,
                comment_id: commentInfo[0].id,
                post_id: commentInfo[0].post_id,
                comment_content: commentInfo[0].content,
                liker_username: likerUsername[0].username,
              },
              content: {},
            }),
          }
        );

        const data = await res.json();
        if (!data.success) {
          console.log(data.message!);
        } else {
          console.log("successfully shot comment like notification!");
        }
      }
    } else {
      // Unlike the comment
      result = await sql`
        WITH delete_like AS (
          DELETE FROM comment_likes
          WHERE user_id = ${userId} AND comment_id = ${commentIdNum}
          RETURNING id
        ),
        update_count AS (
          UPDATE comments
          SET like_count = GREATEST(like_count - 
            CASE WHEN EXISTS (SELECT 1 FROM delete_like) THEN 1 ELSE 0 END, 0)
          WHERE id = ${commentIdNum}
          RETURNING like_count
        )
        SELECT 
          uc.like_count,
          FALSE as is_liked
        FROM update_count uc
      `;
    }

    if (!result || result.length === 0) {
      throw new Error("Failed to update like status");
    }

    return new Response(
      JSON.stringify({
        data: {
          likeCount: result[0].like_count,
          liked: result[0].is_liked,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Comment like update error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update like status",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
