import { neon } from "@neondatabase/serverless";
import { Format } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("id");

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
        p.static_emoji,
        p.reply_to,
        p.unread,
        p.expires_at,
        p.available_at,
        pr.content as prompt,
        b.title as board_title
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      LEFT JOIN prompts pr ON p.prompt_id = pr.id
      LEFT JOIN boards b ON p.board_id = b.id
      WHERE u.clerk_id = ${clerkId}
      ORDER BY p.created_at DESC;
    `;

    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const mappedPosts = response.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      firstname: post.firstname,
      username: post.username,
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
      position:
        post.top !== null && post.left !== null
          ? { top: Number(post.top), left: Number(post.left) }
          : undefined,
      formatting: (post.formatting as Format) || [],
      static_emoji: post.static_emoji,
    }));

    return new Response(JSON.stringify({ posts: mappedPosts }), {
      status: 200,
    });
  } catch (error) {
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
