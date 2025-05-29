import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const url = new URL(request.url);
    const number = Number(url.searchParams.get("number")) || 10;
    const id = url.searchParams.get("id");
    const mode = url.searchParams.get("mode") as "city" | "state" | "country" | null;

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
      locationCondition = `AND u.${mode} = (SELECT u1.${mode} FROM users u1 WHERE u1.clerk_id = '${id}')`;
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
        u.clerk_id,
        u.firstname, 
        u.lastname, 
        u.username,
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
      LEFT JOIN prompts pr ON p.prompt_id = pr.id
      WHERE p.user_id != '${id}' 
      AND p.post_type = 'public'
      ${locationCondition}
      ORDER BY trending_score DESC
      LIMIT ${number};
    `;

    const response = await sql(query);

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch trending posts" }),
      { status: 500 }
    );
  }
}