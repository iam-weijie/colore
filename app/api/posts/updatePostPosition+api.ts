import { neon } from "@neondatabase/serverless";

interface PostPosition {
  postId: string;
  top: number;
  left: number;
}

export async function PATCH(request: Request) {


  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const body = await request.json();
    const { postId, top, left } = body;
    console.log("came here.", postId, top, left)
  

    if (!postId || typeof top !== 'number' || typeof left !== 'number') {
      return new Response(
        JSON.stringify({ error: 'postId, top and left are required and must be valid' }),
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE posts
      SET 
        "top" = ${top},
        "left" = ${left}
      WHERE id = ${postId}
      RETURNING *
    `;

    if (!result || result.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Post not found or not updated' }),
        { status: 404 }
      );
    }

    console.log("updated to", result)

    return new Response(
      JSON.stringify({ 
        data: {
          id: result[0].id,
          top: result[0].top,
          left: result[0].left
        } 
      }),
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in PATCH /api/posts:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: 'Failed to update post position' }),
      { status: 500 }
    );
  }
}