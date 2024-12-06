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

    // combined api call
    const response = await sql`
      SELECT 
        u.clerk_id, 
        u.date_of_birth,
        u.email,
        u.firstname, 
        u.lastname,
        u.username,
        u.country,
        u.state,
        u.city, 
        p.id AS post_id, 
        p.content, 
        p.created_at, 
        p.like_count, 
        p.report_count,
        p.unread_comments,
        p.color
      FROM users u
      LEFT JOIN posts p ON u.clerk_id = p.user_id
      WHERE u.clerk_id = ${clerkId}
      ORDER BY p.created_at DESC;
    `;

    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const userInfo = {
      clerk_id: response[0].clerk_id,
      date_of_birth: response[0].clerk_id,
      firstname: response[0].firstname,
      lastname: response[0].lastname,
      username: response[0].username,
      country: response[0].country,
      state: response[0].state,
      city: response[0].city,
    };

    // no post id, do not return posts
    if (!response[0].post_id) {
      return new Response(JSON.stringify({ userInfo, posts: [] }), {
        status: 200,
      });
    }

    const userPosts = response.map((post) => ({
      id: post.post_id,
      clerk_id: post.clerk_id,
      firstname: post.firstname,
      username: post.username,
      content: post.content,
      created_at: post.created_at,
      city: post.city,
      state: post.state,
      country: post.country,
      like_count: post.like_count,
      report_count: post.report_count,
      unread_comments: post.unread_comments,
      color: post.color,
    }));

    return new Response(JSON.stringify({ userInfo, posts: userPosts }), {
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
