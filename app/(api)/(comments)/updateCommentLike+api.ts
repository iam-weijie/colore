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
          INSERT INTO comment_likes (user_id, comment_id)
          VALUES (${userId}, ${commentIdNum})
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
          TRUE as is_liked
        FROM update_count uc
      `;
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
