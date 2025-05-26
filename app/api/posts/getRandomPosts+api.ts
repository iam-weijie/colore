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
          p.formatting,
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
          p.formatting,
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
          p.formatting,
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
          p.formatting,
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

       const mappedPosts = response.map((post) => ({
      id: post.id,
      clerk_id: post.clerk_id,
      user_id: post.clerk_id, // Using clerk_id as user_id for temporary fix
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
      position: post.top !== null && post.left !== null 
        ? { top: Number(post.top), left: Number(post.left) } 
        : undefined,
      formatting: JSON.parse(post.formatting) || [],
    }));

      return new Response(JSON.stringify({ data: mappedPosts }), {
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
