import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  const sql = neon(`${process.env.DATABASE_URL}`);
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");
    const userId = url.searchParams.get("userId");
    const postIdNum = parseInt(postId!, 10);

    if (!postIdNum || !userId) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
      });
    }

    const result = await sql`
      SELECT 
        p.like_count,
        EXISTS(
          SELECT 1 
          FROM post_likes pl 
          WHERE pl.post_id = ${postIdNum} 
          AND pl.user_id = ${userId}
        ) as is_liked
      FROM posts p
      WHERE p.id = ${postIdNum}
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
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
    console.error("Like status check error:", error);
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
    const { postId, userId, increment } = await request.json();
    const postIdNum = parseInt(postId, 10);

    if (!postIdNum || !userId) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
      });
    }

    let result;

    if (increment) {
      // Like the post
      result = await sql`
        WITH insert_like AS (
          INSERT INTO post_likes (user_id, post_id, unread)
          VALUES (${userId}, ${postIdNum}, TRUE)
          ON CONFLICT (user_id, post_id) DO NOTHING
          RETURNING id
        ),
        update_count AS (
          UPDATE posts
          SET like_count = like_count + 
            CASE WHEN EXISTS (SELECT 1 FROM insert_like) THEN 1 ELSE 0 END
          WHERE id = ${postIdNum}
          RETURNING like_count
        )
        SELECT 
          uc.like_count,
          TRUE as is_liked
        FROM update_count uc
      `;
    } else {
      // Unlike the post
      result = await sql`
        WITH delete_like AS (
          DELETE FROM post_likes
          WHERE user_id = ${userId} AND post_id = ${postIdNum}
          RETURNING id
        ),
        update_count AS (
          UPDATE posts
          SET like_count = GREATEST(like_count - 
            CASE WHEN EXISTS (SELECT 1 FROM delete_like) THEN 1 ELSE 0 END, 0)
          WHERE id = ${postIdNum}
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
    console.error("Like update error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update like status",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
