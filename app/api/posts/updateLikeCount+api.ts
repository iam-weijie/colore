import { sendNotification } from "@/lib/notification";
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
        headers: { "Content-Type": "application/json" }
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
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({
        data: {
          likeCount: result[0].like_count,
          liked: result[0].is_liked,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Like status check error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check like status",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PATCH(request: Request) {
  const sql = neon(`${process.env.DATABASE_URL}`);
  try {
    console.log("[updateLikeCount] PATCH request received");
    
    // Log request body as text before parsing
    const requestText = await request.text();
    console.log("[updateLikeCount] Request body (text):", requestText);
    
    // Now parse the text as JSON
    let requestData;
    try {
      requestData = JSON.parse(requestText);
      console.log("[updateLikeCount] Parsed request data:", requestData);
    } catch (parseError) {
      console.error("[updateLikeCount] Failed to parse request JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body", 
          details: "Could not parse request body as JSON" 
        }), 
        { 
          status: 400, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
    
    const { postId, userId, increment } = requestData;
    
    console.log("[updateLikeCount] Extracted values:", { postId, userId, increment });
    
    const postIdNum = parseInt(postId, 10);
    console.log("[updateLikeCount] Parsed postIdNum:", postIdNum);

    if (!postIdNum || !userId) {
      console.error("[updateLikeCount] Invalid input:", { postIdNum, userId });
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
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
          TRUE as is_liked,
          il.id as like_id
        FROM update_count uc
        LEFT JOIN insert_like il ON true
      `;

      // Dispatching notification of liking post to post owner
      // Refactor: turn 2 sql queries into 1

      const postInfo = await sql`
        SELECT
          id,
          user_id,
          content,
          color
        FROM posts 
        WHERE id = ${postIdNum}
      `;

      const postOwnerInfo = await sql`
        SELECT
          push_token
        FROM users
        WHERE clerk_id = ${postInfo[0].user_id}
      `;

      const likerUsername = await sql.query(`
        SELECT 
          CASE
              WHEN EXISTS (
                SELECT 1
                FROM friendships f
                WHERE 
                  (f.user_id = $1 AND f.friend_id = $2)
                  OR
                  (f.friend_id = $1 AND f.user_id = $2)
              ) THEN u.incognito_name
              ELSE u.username
            END AS username,
        FROM users
        WHERE clerk_id = ${userId}
        JOIN users u ON u.clerk_id = $1
      `, [userId, postInfo[0].user_id]);

      // don't send a notification if someone likes their own post
      if (postInfo[0].user_id !== userId) {
        const notification = {
          id: result[0].like_id,
          post_id: postInfo[0].id,
          post_content: postInfo[0].content,
          post_color: postInfo[0].color,
          liker_username: likerUsername[0].username,
        };

        await sendNotification(
          postInfo[0].user_id,
          "Likes",
          notification,
          {},
          postOwnerInfo[0].push_token
        );
      }
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
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Like update error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update like status",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
