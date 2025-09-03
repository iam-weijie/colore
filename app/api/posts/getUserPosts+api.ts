import { neon } from "@neondatabase/serverless";
import { Format } from "@/types/type";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("id");
    const viewerId = url.searchParams.get("viewerId"); // Add viewer ID to check like status
    const page = parseInt(url.searchParams.get("page") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const offset = page * limit;

    console;
    if (!clerkId) {
      return new Response(
        JSON.stringify({ error: "User ID parameter is required" }),
        { status: 400 }
      );
    }

    const response = await sql`
      SELECT 
        p.id, 
        p.user_id,
        p.content, 
        p.like_count, 
        p.report_count, 
        p.created_at,
        p.unread_comments,
        p.recipient_user_id,
        p.pinned,
        p.color,
        p.emoji,
        p.prompt_id,
        p.board_id,
        p.formatting,
        p.formatting_encrypted,
        p.static_emoji,
        p.reply_to,
        p.unread,
        p.expires_at,
        p.available_at,
        pr.content as prompt,
        b.title as board_title,
        ${viewerId ? sql`EXISTS(
          SELECT 1 
          FROM post_likes pl 
          WHERE pl.post_id = p.id 
          AND pl.user_id = ${viewerId}
        )` : sql`FALSE`} as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      LEFT JOIN prompts pr ON p.prompt_id = pr.id
      LEFT JOIN boards b ON p.board_id = b.id
      WHERE u.clerk_id = ${clerkId}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    // Get user info and total count
    const userInfoQuery = await sql`
      SELECT 
        u.clerk_id,
        u.username,
        u.country,
        u.state,
        u.city,
        COUNT(p.id) as total_posts
      FROM users u
      LEFT JOIN posts p ON u.clerk_id = p.user_id
      WHERE u.clerk_id = ${clerkId}
      GROUP BY u.clerk_id, u.username, u.country, u.state, u.city;
    `;

    if (userInfoQuery.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const userInfo = {
      clerk_id: userInfoQuery[0].clerk_id,
      username: userInfoQuery[0].username,
      country: userInfoQuery[0].country,
      state: userInfoQuery[0].state,
      city: userInfoQuery[0].city,
      total_posts: parseInt(userInfoQuery[0].total_posts)
    };

    const totalPosts = parseInt(userInfoQuery[0].total_posts);
    const hasMore = offset + response.length < totalPosts;


    const userPosts = response.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      firstname: post.firstname,
      username: post.username,
      nickname: post.username, // Use username as nickname if not available
      incognito_name: post.username, // Use username as incognito_name if not available
      content: post.content,
      created_at: post.created_at,
      expires_at: post.expires_at, // Not available in query - set default
      city: post.city,
      state: post.state,
      country: post.country,
      like_count: post.like_count,
      report_count: post.report_count,
      unread_comments: post.unread_comments,
      recipient_user_id: post.recipient_user_id,
      pinned: post.pinned,
      color: post.color,
      emoji: post.emoji,
      notified: post.notified,
      prompt_id: post.prompt_id,
      prompt: post.prompt,
      board_id: post.board_id,
      reply_to: post.reply_to,
      unread: post.unread,
      isLiked: post.is_liked,
      position:
        post.top !== null && post.left !== null
          ? { top: Number(post.top), left: Number(post.left) }
          : undefined,
      formatting: (post.formatting as Format) || [],
      formatting_encrypted: post.formatting_encrypted || null,
      static_emoji: post.static_emoji,
      available_at: post.available_at || post.created_at, // Use created_at as fallback
    }));

     return new Response(JSON.stringify({ 
      userInfo, 
      posts: userPosts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        hasMore
      }
    }), {
      status: 200,
    });
  } catch (error: any) {
    console.error("Database operation failed:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch user posts",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
