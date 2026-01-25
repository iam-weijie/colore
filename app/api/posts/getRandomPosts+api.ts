import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const id = url.searchParams.get("id");
    const mode = url.searchParams.get("mode");

    // comments table to be joined later :]
    if (mode === "city") {

      const response = await sql`
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
          u.clerk_id,
          u.firstname, 
          u.lastname, 
          u.username,
          u.country, 
          u.state, 
          u.city
    
        FROM posts p
        JOIN users u ON p.user_id = u.clerk_id
        WHERE p.user_id != ${id} 
        AND p.post_type = 'public' 
        AND u.city = (SELECT u1.city FROM users u1 WHERE u1.clerk_id = ${id})
        ORDER BY RANDOM()
        LIMIT ${number};
      `;
      return new Response(JSON.stringify({ data: response }), {
        status: 200,
      });
    } else if (mode === "state") {
      const response = await sql`
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
          u.clerk_id,
          u.firstname, 
          u.lastname, 
          u.username,
          u.country, 
          u.state, 
          u.city
    
        FROM posts p
        JOIN users u ON p.user_id = u.clerk_id
        WHERE p.user_id != ${id} 
        AND p.post_type = 'public'
        AND u.state = (SELECT u1.state FROM users u1 WHERE u1.clerk_id = ${id})
        ORDER BY RANDOM()
        LIMIT ${number};
      `;
      return new Response(JSON.stringify({ data: response }), {
        status: 200,
      });
    } else if (mode === "country") {
      const response = await sql`
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
          u.clerk_id,
          u.firstname, 
          u.lastname, 
          u.username,
          u.country, 
          u.state, 
          u.city
    
        FROM posts p
        JOIN users u ON p.user_id = u.clerk_id
        WHERE p.user_id != ${id} 
        AND p.post_type = 'public' 
        AND u.country = (SELECT u1.country FROM users u1 WHERE u1.clerk_id = ${id})
        ORDER BY RANDOM()
        LIMIT ${number};
      `;
      return new Response(JSON.stringify({ data: response }), {
        status: 200,
      });
    } else {
      const response = await sql`
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
        WHERE p.user_id != ${id} AND p.post_type = 'public'
        ORDER BY RANDOM()
        LIMIT ${number};
      `;

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
