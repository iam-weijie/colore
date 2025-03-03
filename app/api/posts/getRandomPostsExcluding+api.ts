import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const id = url.searchParams.get("id");
    const excludeIds =
      url.searchParams.get("exclude_ids")?.split(",").map(Number) || [];

    // Construct the exclusion clause
    const excludeClause =
      excludeIds.length > 0
        ? `AND p.id NOT IN (${excludeIds.map((id) => `'${id}'`).join(",")})`
        : "";
      

    // Construct the full SQL query
    const query = `
      SELECT 
        p.id, 
        p.content, 
        p.like_count, 
        p.report_count, 
        p.created_at,
        p.unread_comments,
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
        ${excludeClause}
      ORDER BY RANDOM()
      LIMIT ${number};
    `;

    const response = await sql(query);

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
