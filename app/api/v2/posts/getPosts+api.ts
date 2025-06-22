import { neon } from "@neondatabase/serverless";
import { Format } from "@/types/type";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const url = new URL(request.url);

    // --- COMMON PARAMS ---
    const type = url.searchParams.get("type"); // "personal"|"user"|"public"|"trending"
    const userId = url.searchParams.get("user_id"); // for personal & public
    const id = url.searchParams.get("id"); // for user & trending
    const recipientId = url.searchParams.get("recipient_id"); // for personal
    const limit = parseInt(url.searchParams.get("number") ?? "25", 10);
    const mode = url.searchParams.get("mode"); // "city"|"state"|"country"

    if (!type) {
      throw new Error("Missing 'type' parameter");
    }

    // --- LOCATION FILTER (for public & trending) ---
    const allowedModes = ["city", "state", "country"];
    const locationCondition =
      mode && allowedModes.includes(mode)
        ? `AND u.${mode} = (
           SELECT u1.${mode}
           FROM users u1
           WHERE u1.clerk_id = $1
         )`
        : "";

    // --- BASE SELECT CLAUSE ---
    const baseSelect = `
      p.id,
      p.content,
      p.user_id,
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
      p.reply_to,
      p.available_at,
      p.expires_at,
      p.formatting,
      p.static_emoji,
      u.clerk_id,
      u.firstname,
      u.lastname,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.user_id = $1 AND f.friend_id = u.clerk_id)
             OR (f.friend_id = $1 AND f.user_id = u.clerk_id)
        ) THEN u.incognito_name
        ELSE u.username
      END AS username,
      u.country,
      u.state,
      u.city,
      pr.content AS prompt
    `;

    let query = "";
    let params: any[] = [];

    // --- BUILD QUERY BASED ON TYPE ---
    switch (type) {
      case "personal":
        if (!userId || !recipientId) {
          throw new Error(
            "Parameters 'user_id' and 'recipient_id' are required for personal posts"
          );
        }
        query = `
          SELECT ${baseSelect}
          FROM posts p
          JOIN users u   ON p.user_id = u.clerk_id
          LEFT JOIN prompts pr ON p.prompt_id = pr.id
          WHERE
            p.post_type = 'personal'
            AND p.recipient_user_id = $2
            AND p.available_at <= NOW()
            AND p.expires_at   > NOW()
          ORDER BY p.created_at DESC
          LIMIT $3
        `;
        params = [userId, recipientId, limit];
        break;

      case "user":
        if (!id) throw new Error("Parameter 'id' is required for user posts");
        query = `
          SELECT ${baseSelect}, b.title AS board_title
          FROM posts p
          JOIN users u   ON p.user_id = u.clerk_id
          LEFT JOIN prompts pr ON p.prompt_id = pr.id
          LEFT JOIN boards  b ON p.board_id = b.id
          WHERE u.clerk_id = $1
          ORDER BY p.created_at DESC
          LIMIT $2
        `;
        params = [id, limit];
        break;

      case "public":
        if (!userId)
          throw new Error("Parameter 'user_id' is required for public posts");
        query = `
          SELECT ${baseSelect}
          FROM posts p
          JOIN users u   ON p.user_id = u.clerk_id
          LEFT JOIN prompts pr ON p.prompt_id = pr.id
          WHERE
            p.post_type = 'public'
            AND p.user_id  != $1
            ${locationCondition}
          ORDER BY RANDOM()
          LIMIT $2
        `;
        params = [userId, limit];
        break;

      case "trending":
        if (!id)
          throw new Error("Parameter 'id' is required for trending posts");
        const W = { likes: 0.7, reports: -0.4, timeDecay: 1.2 };
        query = `
          SELECT
            ${baseSelect},
            (
              (p.like_count * ${W.likes}) +
              (p.report_count * ${W.reports})
            ) /
            (
              EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600
              + ${W.timeDecay}
            ) AS trending_score
          FROM posts p
          JOIN users u   ON p.user_id = u.clerk_id
          LEFT JOIN prompts pr ON p.prompt_id = pr.id
          WHERE
            p.post_type = 'public'
            AND p.user_id != $1
            ${locationCondition}
          ORDER BY trending_score DESC
          LIMIT $2
        `;
        params = [id, limit];
        break;

      default:
        throw new Error(`Unknown type '${type}'`);
    }

    // --- EXECUTE & MAP ---
    const result = await sql.query(query, params);


    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    const status =
      err.message?.startsWith("Missing") || err.message?.includes("required")
        ? 400
        : 500;
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
}
