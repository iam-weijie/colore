import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`, { fullResults: true });
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const id = url.searchParams.get("id");
    const mode = url.searchParams.get("mode");
    const excludeIds =
      url.searchParams.get("exclude_ids")?.split(",").map(String) || [];

    const baseQuery = `
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
          pr.content as prompt
       FROM posts p
       JOIN users u ON p.user_id = u.clerk_id
       LEFT JOIN prompts pr ON p.prompt_id = pr.id
    `;

    let whereClause = `WHERE p.user_id != $1 AND p.post_type = 'public'`;
    const params: any[] = [id!, number!];

    if (mode && ['city', 'state', 'country'].includes(mode)) {
      whereClause += ` AND u.${mode} = (SELECT u1.${mode} FROM users u1 WHERE u1.clerk_id = $1)`;
    }

    if (excludeIds.length > 0) {
      whereClause += ` AND p.id <> ALL($3::text[])`;
      params.push(excludeIds);
    }

    const query = `${baseQuery} ${whereClause} ORDER BY RANDOM() LIMIT $2;`;

    const { rows } = await sql.query(query, params);

    if (rows.length === 0) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
        });
      }

    return new Response(JSON.stringify({ data: rows }), {
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
