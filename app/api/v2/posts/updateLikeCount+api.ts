import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const postIdParam = url.searchParams.get("postId");
    const userId = url.searchParams.get("userId");

    if (!postIdParam || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing postId or userId" }),
        { status: 400 }
      );
    }

    const postId = parseInt(postIdParam, 10);
    if (isNaN(postId)) {
      return new Response(JSON.stringify({ error: "Invalid postId" }), {
        status: 400,
      });
    }

    // Query like count and existence
    const [row] = await sql`
      SELECT
        p.like_count   AS "likeCount",
        EXISTS (
          SELECT 1 FROM post_likes pl
          WHERE pl.post_id = ${postId}
            AND pl.user_id = ${userId}
        )               AS "liked"
      FROM posts p
      WHERE p.id = ${postId}
    `;

    if (!row) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ data: { likeCount: row.likeCount, liked: row.liked } }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET /likes error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { postId: postIdParam, userId, increment } = body;

    // Validate types
    if (
      typeof postIdParam !== "string" ||
      typeof userId !== "string" ||
      typeof increment !== "boolean"
    ) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
      });
    }

    // Parse and validate number
    const postId = parseInt(postIdParam, 10);
    if (isNaN(postId)) {
      return new Response(JSON.stringify({ error: "Invalid postId" }), {
        status: 400,
      });
    }

    let rows;
    if (increment) {
      // Insert like and bump count
      rows = await sql`
        WITH inserted AS (
          INSERT INTO post_likes (user_id, post_id, unread)
          VALUES (${userId}, ${postId}, TRUE)
          ON CONFLICT DO NOTHING
          RETURNING id
        ), updated AS (
          UPDATE posts
          SET like_count = like_count + (
            SELECT COUNT(*) FROM inserted
          )
          WHERE id = ${postId}
          RETURNING like_count
        )
        SELECT
          updated.like_count AS "likeCount",
          TRUE                AS "liked",
          inserted.id         AS "likeId"
        FROM updated
        LEFT JOIN inserted ON TRUE
      `;

      // Send notification only if a new like was created
      const result = rows[0];
      if (result.likeId) {
        try {
          const [postInfo] = await sql`
            SELECT user_id, content, color
            FROM posts
            WHERE id = ${postId}
          `;
          const [liker] = await sql`
            SELECT username
            FROM users
            WHERE clerk_id = ${userId}
          `;

          if (postInfo.user_id !== userId) {
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_SERVER_URL}/dispatch`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: postInfo.user_id,
                  type: "Likes",
                  notification: {
                    id: result.likeId,
                    post_id: postId,
                    post_content: postInfo.content,
                    post_color: postInfo.color,
                    liker_username: liker.username,
                  },
                  content: {},
                }),
              }
            );
            const data = await res.json();
            if (!data.success) {
              console.error("Notification failed:", data.message);
            }
          }
        } catch (notifyErr) {
          console.error("Notification dispatch error:", notifyErr);
        }
      }
    } else {
      // Remove like and decrement count
      rows = await sql`
        WITH deleted AS (
          DELETE FROM post_likes
          WHERE user_id = ${userId} AND post_id = ${postId}
          RETURNING id
        ), updated AS (
          UPDATE posts
          SET like_count = GREATEST(
            like_count - (SELECT COUNT(*) FROM deleted),
            0
          )
          WHERE id = ${postId}
          RETURNING like_count
        )
        SELECT
          updated.like_count AS "likeCount",
          FALSE               AS "liked"
        FROM updated
      `;
    }

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Post not found or like unchanged" }),
        { status: 404 }
      );
    }

    const { likeCount, liked } = rows[0];
    return new Response(JSON.stringify({ data: { likeCount, liked } }), {
      status: 200,
    });
  } catch (err: any) {
    console.error("PATCH /likes error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
