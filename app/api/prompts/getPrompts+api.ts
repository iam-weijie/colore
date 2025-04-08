import { neon } from "@neondatabase/serverless";
import { Prompt } from "@/types/type";
import { temporaryColors } from "@/constants";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);

    // Execute the query using `ANY($1::int[])` for safer parameter handling
    const response = await sql`
      SELECT 
      p.id,
      p.cue,
      p.content,
      p.theme,
      p.engagement 
      FROM prompts p
      ORDER BY p.engagement DESC
      LIMIT 15;
    `;

    if (response.length === 0) {
      return new Response(JSON.stringify({ error: "No posts found" }), {
        status: 404,
      });
    }

    // Map the response to ensure each prompt's fields are assigned correctly
    const promptsData: Prompt[] = response.map((p) => ({
      id: p.id, // Explicitly assign `id`
      cue: p.cue,
      content: p.content, // Explicitly assign `content`
      theme: p.theme, // Explicitly assign `theme`
      engagement: p.engagement, // Explicitly assign `engagement`
      color: temporaryColors[Math.floor(Math.random() * 4)].hex, // Add color property
    }));

    console.log("prompts", promptsData)
    // Return the posts data with the color property
    return new Response(JSON.stringify({ data: promptsData }), { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
      status: 500,
    });
  }
}
