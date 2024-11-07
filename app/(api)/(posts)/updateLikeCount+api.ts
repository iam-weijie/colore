import { neon } from "@neondatabase/serverless";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeWithRetry(operation: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && (error as any)?.code === "ECONNRESET") {
      console.log(`Retrying operation, ${retries} attempts remaining...`);
      await wait(RETRY_DELAY);
      return executeWithRetry(operation, retries - 1);
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  try {
    console.log("Starting like update process");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { postId, userId, increment } = await request.json();
    const postIdNum = parseInt(postId, 10);

    if (!postIdNum || !userId) {
      console.error("Invalid input:", { postId, userId, postIdNum });
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400 }
      );
    }

    console.log("Processing like update:", { postIdNum, userId, increment });

    // Combine all operations into a single database call
    const result = await executeWithRetry(async () => {
      return await sql`
        WITH post_check AS (
          SELECT id, like_count 
          FROM posts 
          WHERE id = ${postIdNum}
        ),
        user_check AS (
          SELECT clerk_id, liked_posts
          FROM users
          WHERE clerk_id = ${userId}
        ),
        post_update AS (
          UPDATE posts p
          SET like_count = CASE
            WHEN ${increment} AND NOT ${postIdNum} = ANY(COALESCE((SELECT liked_posts FROM user_check), ARRAY[]::integer[]))
            THEN p.like_count + 1
            WHEN NOT ${increment} AND ${postIdNum} = ANY(COALESCE((SELECT liked_posts FROM user_check), ARRAY[]::integer[]))
            THEN GREATEST(p.like_count - 1, 0)
            ELSE p.like_count
          END
          WHERE id = ${postIdNum}
          RETURNING like_count
        ),
        user_update AS (
          UPDATE users u
          SET liked_posts = CASE
            WHEN ${increment} AND NOT ${postIdNum} = ANY(COALESCE(u.liked_posts, ARRAY[]::integer[]))
            THEN array_append(COALESCE(u.liked_posts, ARRAY[]::integer[]), ${postIdNum})
            WHEN NOT ${increment} AND ${postIdNum} = ANY(COALESCE(u.liked_posts, ARRAY[]::integer[]))
            THEN array_remove(COALESCE(u.liked_posts, ARRAY[]::integer[]), ${postIdNum})
            ELSE u.liked_posts
          END
          WHERE clerk_id = ${userId}
          RETURNING liked_posts
        )
        SELECT 
          (SELECT like_count FROM post_update) as new_like_count,
          (SELECT liked_posts FROM user_update) as updated_liked_posts;
      `;
    });

    if (!result || result.length === 0) {
      throw new Error("Failed to update like status");
    }

    const newLikeCount = result[0].new_like_count;
    const updatedLikedPosts = result[0].updated_liked_posts || [];

    console.log("Update successful:", {
      likeCount: newLikeCount,
      likedPosts: updatedLikedPosts
    });

    return new Response(
      JSON.stringify({
        data: {
          likeCount: newLikeCount,
          liked: updatedLikedPosts.includes(postIdNum)
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Like update error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update like status",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    console.log("Starting like status check");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");
    const userId = url.searchParams.get("userId");
    const postIdNum = parseInt(postId!, 10);

    if (!postIdNum || !userId) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400 }
      );
    }

    const result = await executeWithRetry(async () => {
      return await sql`
        WITH post_data AS (
          SELECT like_count 
          FROM posts 
          WHERE id = ${postIdNum}
        ),
        user_data AS (
          SELECT liked_posts 
          FROM users 
          WHERE clerk_id = ${userId}
        )
        SELECT 
          (SELECT like_count FROM post_data) as like_count,
          (SELECT liked_posts FROM user_data) as liked_posts;
      `;
    });

    if (!result || result.length === 0) {
      return new Response(
        JSON.stringify({ error: "Data not found" }),
        { status: 404 }
      );
    }

    const likeCount = result[0].like_count;
    const likedPosts = result[0].liked_posts || [];

    return new Response(
      JSON.stringify({
        data: {
          likeCount,
          liked: likedPosts.includes(postIdNum)
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Like status check error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check like status",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500 }
    );
  }
}