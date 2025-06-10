import { neon } from "@neondatabase/serverless";
import { Format } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("user_id");

    if (!clerkId) {
      return new Response(
        JSON.stringify({ error: "User ID parameter is required" }),
        { status: 400 }
      );
    }

    const response = await sql`
      WITH user_prompts AS (
        SELECT
          id AS prompt_id,
          user_id,
          cue,
          content AS prompt_content,
          theme,
          created_at AS prompt_created_at
        FROM prompts
        WHERE user_id = ${clerkId}
      )
      SELECT
        p.id AS post_id,
        p.user_id AS post_user_id,
        u.firstname,
        u.username,
        p.content AS post_content,
        p.created_at AS post_created_at,
        p.expires_at,
        u.city,
        u.state,
        u.country,
        p.like_count,
        p.report_count,
        p.unread_comments,
        p.recipient_user_id,
        p.pinned,
        p.color,
        p.emoji,
        p.prompt_id,
        pr.prompt_content AS prompt_content,
        p.board_id,
        b.title AS board_title,
        p.reply_to,
        p.unread,
        p.formatting,
        p.static_emoji
      FROM user_prompts pr
      LEFT JOIN posts p ON p.prompt_id = pr.prompt_id
      LEFT JOIN users u ON p.user_id = u.clerk_id
      LEFT JOIN boards b ON p.board_id = b.id
      ORDER BY pr.prompt_created_at DESC, p.created_at DESC;
    `;

    //  Map the results to prompts and posts
    const promptsMap = new Map<string, any>();
    const posts = [];

    for (const row of response) {
      if (!promptsMap.has(row.prompt_id)) {
        // Only add the prompt if it doesn't already exist in the map
        promptsMap.set(row.prompt_id, {
          id: row.prompt_id,
          user_id: clerkId,
          cue: row.cue,
          content: row.prompt_content,
          theme: row.theme,
          created_at: row.prompt_created_at,
        });
      }

      if (row.post_id !== null) {
        // Only add the post if it has a valid post_id
        posts.push({
          id: row.post_id,
          user_id: row.post_user_id,
          firstname: row.firstname,
          username: row.username,
          content: row.post_content,
          created_at: row.post_created_at,
          expires_at: row.expires_at,
          city: row.city,
          state: row.state,
          country: row.country,
          like_count: row.like_count,
          report_count: row.report_count,
          unread_comments: row.unread_comments,
          recipient_user_id: row.recipient_user_id,
          pinned: row.pinned,
          color: row.color,
          emoji: row.emoji,
          prompt_id: row.prompt_id,
          prompt: row.prompt_content,
          board_id: row.board_id,
          board_title: row.board_title,
          reply_to: row.reply_to,
          unread: row.unread,
          formatting: (row.formatting as Format) || [],
          static_emoji: row.static_emoji,
          position:
            row.top !== null && row.left !== null
              ? { top: Number(row.top), left: Number(row.left) }
              : undefined,
        });
      }
    }

    const prompts = Array.from(promptsMap.values());

    console.log("Fetched prompts and posts:", {
      prompts: prompts.length,
      posts: posts.length,
    });

    return new Response(JSON.stringify({ prompts, posts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Database operation failed:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch data",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
