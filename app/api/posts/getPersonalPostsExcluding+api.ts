import { Format } from "@/types/type";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const recipientId = url.searchParams.get("recipient_id");
    const viewerId = url.searchParams.get("user_id");
    const excludeIds = url.searchParams.get("exclude_ids")?.split(",").map(String) || [];

    if (!recipientId || !viewerId) {
      return new Response(
        JSON.stringify({ error: "Missing recipient_id or user_id parameter" }),
        { status: 400 }
      );
    }

    const excludeClause = excludeIds.length > 0
      ? `AND p.id NOT IN (${excludeIds.map((id) => `'${id}'`).join(",")})`
      : "";

    const query = `
      SELECT 
        p.id, 
        p.content, 
        p.like_count, 
        p.report_count, 
        p.created_at,
        p.unread_comments,
        p.pinned,
        p.color,
        p.emoji,
        p.board_id,
        p.prompt_id,
        p.recipient_user_id,
        p.unread,
        p.top,
        p.left,
        p.formatting,
        p.static_emoji,
        u.clerk_id,
        u.firstname, 
        u.lastname, 
        u.username,
        u.country, 
        u.state, 
        u.city,
        pr.content as prompt
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      LEFT JOIN prompts pr ON p.prompt_id = pr.id
      WHERE p.recipient_user_id = '${recipientId}'
        AND p.post_type = 'personal'
        AND p.expires_at > NOW()
        AND p.available_at <= NOW()
        ${excludeClause}
      ORDER BY p.created_at DESC
      LIMIT ${number};
    `;

    const response = await sql(query);

    // Filter and transform the posts
    const personalPosts = response
      .map((post) => ({
        id: post.id,
        clerk_id: post.clerk_id,
        user_id: post.user_id, // Temporary fix
        firstname: post.firstname,
        username: post.username,
        content: post.content,
        created_at: post.created_at,
        expires_at: "", // Default value
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
        notified: false, // Default value
        prompt_id: post.prompt_id,
        prompt: post.prompt,
        board_id: post.board_id || -1,
        reply_to: -1, // Default value
        unread: post.unread,
        position: post.top !== null && post.left !== null 
          ? { top:  Number(post.top), left:  Number(post.left) } 
          : undefined,
      formatting: post.formatting as Format || [],
      static_emoji: post.static_emoji
      }));

    return new Response(JSON.stringify({ data: personalPosts }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("Error fetching personal posts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch personal posts" }),
      { status: 500 }
    );
  }
}