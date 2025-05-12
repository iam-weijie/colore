import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");
    const userId = url.searchParams.get("userId");
    const page = parseInt(url.searchParams.get("page") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const offset = page * limit;

    if (!postId) {
      console.error("Missing postId parameter");
      return new Response(
        JSON.stringify({
          error: "Missing postId parameter",
          debug: { postId, userId },
        }),
        { status: 400 }
      );
    }

    // Get comments with pagination
    const response = await sql`
      SELECT 
        c.id, 
        c.post_id,
        c.user_id,
        c.sender_id,
        c.content, 
        u.username,
        c.created_at,
        c.like_count, 
        c.report_count,
        c.index,
        c.reply_comment_id
      FROM comments c
      JOIN users u ON c.user_id = u.clerk_id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC
      LIMIT ${limit} OFFSET ${offset};
    `;

    // Get total count for pagination
    const countResult = await sql`
      SELECT COUNT(*) as total 
      FROM comments 
      WHERE post_id = ${postId};
    `;
    
    const total = parseInt(countResult[0].total);
    const hasMore = offset + response.length < total;

    // Get like statuses for all comments for this user
    let likeStatuses = {};
    let likeCounts = {};
    
    if (userId) {
      // Get all comment likes for this user in one query
      const likesResult = await sql`
        SELECT c.id, 
               EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ${userId}) as is_liked,
               c.like_count
        FROM comments c 
        WHERE c.post_id = ${postId};
      `;
      
      // Convert to simple objects for the frontend
      likeStatuses = likesResult.reduce((acc, item) => {
        acc[item.id] = item.is_liked;
        return acc;
      }, {});
      
      likeCounts = likesResult.reduce((acc, item) => {
        acc[item.id] = item.like_count;
        return acc;
      }, {});
    }

    return new Response(JSON.stringify({ 
      data: {
        comments: response,
        hasMore,
        likeStatuses,
        likeCounts
      },
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch comments",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
} 