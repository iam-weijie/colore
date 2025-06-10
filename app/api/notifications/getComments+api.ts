import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("id");

    if (!clerkId) {
      return new Response(
        JSON.stringify({ error: "Missing user ID parameter" }),
        { status: 400 }
      );
    }

    const postsWithComments = await sql`
      SELECT 
        p.id,
        p.content,
        u.firstname,
        u.username, 
        p.created_at,
        p.user_id,
        p.like_count,
        p.report_count,
        p.unread_comments,
        p.color,
        p.post_type,
        p.board_id,
        json_agg(
          json_build_object(
            'id', c.id,
            'comment_content', c.content,
            'comment_created_at', c.created_at,
            'comment_like_count', c.like_count,
            'comment_report_count', c.report_count,
            'notified', c.notified,
            'commenter_firstname', c.firstname,
            'commenter_username', c.username,
            'is_liked', COALESCE(cl.is_liked, FALSE)
          )
        ) FILTER (WHERE c.id IS NOT NULL) AS comments
      FROM posts p
      JOIN users u ON p.user_id = u.clerk_id
      LEFT JOIN LATERAL (
        SELECT 
          c.*, 
          u.firstname, 
          u.username,
          CASE 
            WHEN EXISTS (
              SELECT 1 
              FROM comment_likes cl 
              WHERE cl.comment_id = c.id 
              AND cl.user_id = ${clerkId}
            ) THEN TRUE 
            ELSE FALSE 
          END AS is_liked
        FROM comments c
        JOIN users u ON c.user_id = u.clerk_id
        WHERE c.post_id = p.id
        ORDER BY c.created_at DESC
        LIMIT p.unread_comments
      ) c ON TRUE
      LEFT JOIN LATERAL (
        SELECT TRUE AS is_liked
        FROM comment_likes cl
        WHERE cl.comment_id = c.id
        AND cl.user_id = ${clerkId}
      ) cl ON TRUE
      WHERE u.clerk_id = ${clerkId}
      GROUP BY p.id, u.firstname, u.username
      HAVING json_agg(c.*) IS NOT NULL
      ORDER BY p.created_at ASC;
    `;

    // Sum up all unread_comments

    if (postsWithComments.length === 0) {
      return new Response(
        JSON.stringify({ toNotify: [], toStore: [], unread_count: 0 }),
        {
          status: 200,
        }
      );
    }

    const filteredPosts = postsWithComments.filter(
      (post: any) => post.comments
    ); //

    const postsWithUnreadComments = filteredPosts
      .filter((post: any) => post.comments.some((c: any) => !c.notified))
      .map((post: any) => ({
        ...post,
        comments: post.comments.filter(
          (comment: any) => comment.id !== clerkId
        ),
      }));

    const unread_comments = filteredPosts.reduce(
      (sum: number, post: any) => sum + (post.unread_comments || 0),
      0
    );
    const unread_comments = filteredPosts.reduce(
      (sum: number, post: any) => sum + (post.unread_comments || 0),
      0
    );

    const storedPosts = postsWithComments
      .filter((post: any) => post.comments)
      .map((post: any) => ({
        ...post,
        comments: post.comments.filter(
          (comment: any) => comment.id !== clerkId
        ),
      }));
    const storedPosts = postsWithComments
      .filter((post: any) => post.comments)
      .map((post: any) => ({
        ...post,
        comments: post.comments.filter(
          (comment: any) => comment.id !== clerkId
        ),
      }));

    //console.log("stored", storedPosts.length)
    //console.log("stored", storedPosts.length)
    return new Response(
      JSON.stringify({
        toNotify: postsWithUnreadComments,
        toStore: storedPosts,
        unread_count: unread_comments,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user posts and comments." }),
      { status: 500 }
    );
  }
}
