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
      u.clerk_id,
      u.firstname, 
      u.lastname, 
      u.username,
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

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch random posts" }),
      { status: 500 }
    );
  }
}