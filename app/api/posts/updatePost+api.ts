import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { content, postId, color, emoji, formatting } = await request.json();
    const { content, postId, color, emoji, formatting } = await request.json();

    const updateQuery = formatting !== undefined 
      ? sql`
          UPDATE posts
          SET 
            content=${content},
            color=${color},
            emoji=${emoji},
            formatting=${formatting}
          WHERE id=${postId}
          RETURNING *;
        `
      : sql`
          UPDATE posts
          SET 
            content=${content},
            color=${color},
            emoji=${emoji}
          WHERE id=${postId}
          RETURNING *;
        `;
    const updateQuery = formatting !== undefined 
      ? sql`
          UPDATE posts
          SET 
            content=${content},
            color=${color},
            emoji=${emoji},
            formatting=${formatting}
          WHERE id=${postId}
          RETURNING *;
        `
      : sql`
          UPDATE posts
          SET 
            content=${content},
            color=${color},
            emoji=${emoji}
          WHERE id=${postId}
          RETURNING *;
        `;

    const response = await updateQuery;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
