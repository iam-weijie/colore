import { Format } from "@/types/type";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("number")) || 10;
    const userId = url.searchParams.get("id");
    const mode = url.searchParams.get("mode");

    const baseSelectFields = `
      p.id, 
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
      u.clerk_id,
      u.firstname, 
      u.lastname, 
      u.username,
      u.nickname,
      u.incognito_name,
      u.country, 
      u.state, 
      u.city,
      pr.content as prompt
    `;

    // Validate mode against allowed values
    const allowedModes = ["city", "state", "country"];
    const locationFilter = allowedModes.includes(mode ?? "")
      ? `u.${mode} = (SELECT u1.${mode} FROM users u1 WHERE u1.clerk_id = '${userId}')`
      : "1=1";

    // Directly interpolate values into the SQL string
    const query = `
      SELECT
        ${baseSelectFields}
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      LEFT JOIN prompts pr ON p.prompt_id = pr.id
      WHERE p.user_id != '${userId}'
      AND p.post_type = 'public'
      AND ${locationFilter}
      ORDER BY RANDOM()
      LIMIT ${limit};
    `;

    const response = await sql(query);
    const mappedPosts = response.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      firstname: post.firstname,
      username: post.username,
      nickname: post.nickname,
      incognito_name: post.incognito_name,
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

    return new Response(JSON.stringify({ data: mappedPosts }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch random posts" }),
      {
        status: 500,
      }
    );
  }
}
