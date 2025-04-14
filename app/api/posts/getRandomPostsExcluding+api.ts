import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const id = url.searchParams.get("id");
    const mode = url.searchParams.get("mode");
    const excludeIds =
      url.searchParams.get("exclude_ids")?.split(",").map(Number) || [];

    // Construct the exclusion clause
    const excludeClause =
      excludeIds.length > 0
        ? `AND p.id NOT IN (${excludeIds.map((id) => `'${id}'`).join(",")})`
        : "";

    if (mode === "city") {
      const query =  `
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
          u.clerk_id,
          u.firstname, 
          u.lastname, 
          u.username,
          u.country, 
          u.state, 
          u.city
        FROM posts p
        JOIN users u ON p.user_id = u.clerk_id
        WHERE p.user_id != '${id}' 
          AND p.post_type = 'public' 
          AND u.city = (SELECT u1.city FROM users u1 WHERE u1.clerk_id = '${id}')
          ${excludeClause}
        ORDER BY RANDOM()
        LIMIT ${number};
      `;
      const response = await sql(query);

      if (response.length === 0) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ data: response }), {
        status: 200,
      });
    }
    else if (mode === "state") {
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
          u.clerk_id,
          u.firstname, 
          u.lastname, 
          u.username,
          u.country, 
          u.state, 
          u.city
        FROM posts p
        JOIN users u ON p.user_id = u.clerk_id
        WHERE p.user_id != '${id}' 
          AND p.post_type = 'public' 
          AND u.state = (SELECT u1.state FROM users u1 WHERE u1.clerk_id = '${id}')
          ${excludeClause}
        ORDER BY RANDOM()
        LIMIT ${number};
      `;
      const response = await sql(query);
      if (response.length === 0) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ data: response }), {
        status: 200,
      });
    }
    else if (mode === "country") {
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
          u.clerk_id,
          u.firstname, 
          u.lastname, 
          u.username,
          u.country, 
          u.state, 
          u.city
        FROM posts p
        JOIN users u ON p.user_id = u.clerk_id
        WHERE p.user_id != '${id}' 
          AND p.post_type = 'public' 
          AND u.country = (SELECT u1.country FROM users u1 WHERE u1.clerk_id = '${id}')
          ${excludeClause}
        ORDER BY RANDOM()
        LIMIT ${number};
      `;
      const response = await sql(query);
      if (response.length === 0) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ data: response }), {
        status: 200,
      });
    }
    else {
   // Construct the full SQL query
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
      pr.content as prompt
   FROM posts p
   JOIN users u ON p.user_id = u.clerk_id
   LEFT JOIN prompts pr ON p.prompt_id = pr.id
   WHERE p.user_id != '${id}' 
     AND p.post_type = 'public'
     ${excludeClause}
   ORDER BY RANDOM()
   LIMIT ${number};
 `;

 const response = await sql(query);

 return new Response(JSON.stringify({ data: response }), {
   status: 200,
 });
    }
 
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
