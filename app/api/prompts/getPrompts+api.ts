import { neon } from "@neondatabase/serverless";
import { Prompt } from "@/types/type";
import { defaultColors } from "@/constants";

// v1.0.0+ requires Node.js >= 19
const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("user_id");
    const userId = userIdParam ? Number(userIdParam) : null;

    const response = userId
      ? await sql`
          SELECT
            p.id,
            p.user_id,
            p.cue,
            p.content,
            p.theme,
            p.engagement,
            p.created_at
          FROM prompts p
          WHERE p.user_id = ${userId}
          ORDER BY p.created_at ASC
          LIMIT 15;
        `
      : await sql`
          SELECT
            p.id,
            p.user_id,
            p.cue,
            p.content,
            p.theme,
            p.engagement,
            p.created_at
          FROM prompts p
          ORDER BY p.created_at DESC
          LIMIT 15;
        `;

    if (response.length === 0) {
      return new Response(
        JSON.stringify({
          error: userId ? "No prompts for that user" : "No prompts found",
        }),
        { status: 404 }
      );
    }

    const promptsData = response.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      cue: p.cue,
      content: p.content,
      theme: p.theme,
      engagement: p.engagement,
      created_at: p.created_at,
      color:
        defaultColors[Math.floor(Math.random() * defaultColors.length)].hex,
    }));

    return new Response(JSON.stringify({ data: promptsData }), {
      status: 200,
    });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch prompts" }), {
      status: 500,
    });
  }
}
