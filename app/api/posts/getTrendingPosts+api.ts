import { Format } from "@/types/type";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const id = url.searchParams.get("id");
    const mode = url.searchParams.get("mode") as
      | "city"
      | "state"
      | "country"
      | null;

    // Define score weights
    const SCORE_WEIGHTS = {
      likes: 0.7,
      replies: 0.3,
      reports: -0.4,
      timeDecay: 1.2,
    };

    // Build location condition
    let locationCondition = "";
    if (mode && ["city", "state", "country"].includes(mode)) {
      locationCondition = `AND u.${mode} = (SELECT u1.${mode} FROM users u1 WHERE u1.clerk_id = $1)`;
    }

    // Build the complete query
    const query = `
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
        u.clerk_id,
        u.firstname, 
        u.lastname, 
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM friendships f
            WHERE 
              (f.user_id = $1 AND f.friend_id = u.clerk_id)
              OR
              (f.friend_id = $1 AND f.user_id = u.clerk_id)
          ) THEN u.incognito_name
          ELSE u.username
        END AS username,
        u.country, 
        u.state, 
        u.city,
        pr.content as prompt,
        (
          (p.like_count * ${SCORE_WEIGHTS.likes}) +
          (p.report_count * ${SCORE_WEIGHTS.reports})
        ) /
        (
          EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 +
          ${SCORE_WEIGHTS.timeDecay}
        ) AS trending_score
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      JOIN prompts pr ON p.prompt_id = pr.id
      WHERE p.user_id != $1 
      AND p.post_type = 'public'
      ${locationCondition}
      ORDER BY trending_score DESC
      LIMIT $2;
    `;

    const response = await sql.query(query, [id, number]);

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

    return new Response(JSON.stringify({ data: response }), {
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
