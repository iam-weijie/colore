import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids"); // Retrieve the 'ids' query param
    const page = parseInt(url.searchParams.get("page") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const offset = page * limit;

    if (!idsParam) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'ids' query parameter" }),
        { status: 400 }
      );
    }

    // Convert to an array of numbers
    const ids = idsParam
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id)); // Ensure all IDs are valid integers

    if (ids.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid post IDs" }), {
        status: 400,
      });
    }

    // Get total count first
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM posts p
      WHERE p.id = ANY(${ids}::int[])
    `;
    
    const total = parseInt(countResult[0].total);
    
    // Execute the query with pagination
    const response = await sql`
      SELECT *
      FROM posts p
      WHERE p.id = ANY(${ids}::int[])
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Check if posts were found
    if (response.length === 0 && page === 0) {
      return new Response(JSON.stringify({ error: "No posts found" }), {
        status: 404,
      });
    }

    const hasMore = offset + response.length < total;

    // Return the posts data with pagination info
    return new Response(JSON.stringify({ 
      data: response,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    }), { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
      status: 500,
    });
  }
}
