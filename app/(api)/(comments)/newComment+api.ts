import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    console.log("Received POST request.");
    const { clerkId, postId, postClerkId, content } = await request.json();

    let response;

    if (clerkId !== postClerkId) {
      response = await sql`
        WITH insert_comment AS (
          INSERT INTO comments (user_id, post_id, content)
          VALUES (${clerkId}, ${postId}, ${content})
          RETURNING id
        )
        UPDATE posts
        SET unread_comments = unread_comments + 1
        WHERE id = ${postId}
        RETURNING (SELECT id FROM insert_comment) AS comment_id;
      `;
    } else {
      response = await sql`
        INSERT INTO comments (user_id, post_id, content)
        VALUES (${clerkId}, ${postId}, ${content})
        ;
      `;
    }

    // const response = await sql`
    //   INSERT INTO comments (user_id, post_id, content)
    //   VALUES (${clerkId}, ${postId}, ${content})
    //   ;
    // `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
