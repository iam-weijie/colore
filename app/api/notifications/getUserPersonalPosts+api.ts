import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  //console.log("Received GET request for user posts and information");
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("id");

    if (!clerkId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
      });
    }

  
    const response = await sql`
      SELECT 
        p.id, 
        p.content, 
        p.like_count, 
        p.report_count, 
        p.created_at,
        p.unread_comments,
        p.pinned,
        p.color,
        p.emoji,
        p.recipient_user_id,
        p.notified,
        u.clerk_id,
        u.firstname, 
        u.lastname, 
        u.username,
        u.country, 
        u.state, 
        u.city
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      WHERE p.recipient_user_id = ${clerkId}
        AND p.post_type = 'personal'
        AND p.user_id != ${clerkId}
    ORDER BY p.unread_comments DESC, p.created_at DESC;
  `;

    if (response.length === 0) {
      return new Response(JSON.stringify({ toNotify: [], toStore: [], unread_count: 0 }), {
        status: 200,
      });
    }

    const userPosts = response.map((post) => ({
      id: post.id,
      clerk_id: post.clerk_id,
      username: post.username,
      content: post.content,
      created_at: post.created_at,
      city: post.city,
      state: post.state,
      country: post.country,
      like_count: post.like_count,
      report_count: post.report_count,
      unread_comments: post.unread_comments,
      recipient_user_id: post.recipient_user_id,
      color: post.color,
      notified: post.notified
    }));

    
    const filterPosts = userPosts.filter((p) => !p.notified)
   // console.log("user post", userPosts.length, filterPosts.length)

    return new Response(JSON.stringify({ toNotify: filterPosts, toStore: userPosts, unread_count: userPosts.length }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user info and posts" }),
      {
        status: 500,
      }
    );
  }
}
