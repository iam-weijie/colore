import { Format } from "@/types/type";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // validate & clamp limit
    const limit = Math.min(100, Math.max(1, Number(number) || 20));

    const SCORE_WEIGHTS = {
      likes: 0.7,
      replies: 0.3,   // reserved for future use if you add replies_count
      reports: -0.4,
      timeDecay: 1.2,
    };

    // NOTE: cast weights to float8 to avoid integer coercion
    const rows = await sql/*sql*/`
      SELECT
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
        p.expires_at,
        p.notified,
        p.reply_to,
        p.unread,
        p.top,
        p.left,
        u.clerk_id AS user_id,
        u.firstname, 
        u.lastname, 
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM friendships f
            WHERE 
              (f.user_id = ${id} AND f.friend_id = u.clerk_id)
              OR
              (f.friend_id = ${id} AND f.user_id = u.clerk_id)
          ) THEN u.incognito_name
          ELSE u.username
        END AS username,
        u.country, 
        u.state, 
        u.city,
        pr.content AS prompt,
        (
          (p.like_count * ${SCORE_WEIGHTS.likes}::float8) +
          (p.report_count * ${SCORE_WEIGHTS.reports}::float8)
        ) /
        (
          EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0
          + ${SCORE_WEIGHTS.timeDecay}::float8
        ) AS trending_score
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      LEFT JOIN prompts pr ON p.prompt_id = pr.id
      WHERE p.user_id <> ${id}
        AND p.post_type = 'public'
      ORDER BY trending_score DESC NULLS LAST
      LIMIT ${limit};
    `;

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ error: "No posts found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mappedPosts = rows.map((post: any) => ({
      id: post.id,
      user_id: post.user_id,
      firstname: post.firstname,
      username: post.username,
      content: post.content,
      created_at: post.created_at,
      expires_at: post.expires_at ?? "",
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
      notified: post.notified ?? false,
      prompt_id: post.prompt_id,
      prompt: post.prompt ?? null,
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
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching trending posts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch trending posts" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
