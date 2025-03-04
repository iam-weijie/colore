import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids"); // Retrieve the 'ids' query param

    if (!idsParam) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'ids' query parameter" }),
        { status: 400 }
      );
    }


    // Convert to an array of numbers
    const ids = idsParam.split(',')
      .map(id => Number(id.trim()))
      .filter(id => Number.isInteger(id)); // Ensure all IDs are valid integers

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid post IDs" }),
        { status: 400 }
      );
    }
    // Execute the query using `ANY($1::int[])` for safer parameter handling
    const response = await sql`
      SELECT *
      FROM posts p
      WHERE p.id = ANY(${ids}::int[])
    `;
console.log("pinned updated", response.map((p) => {
  return {id: p.id, pinned: p.pinned}
}))
    // Check if posts were found
    if (response.length === 0) {
      return new Response(
        JSON.stringify({ error: "No posts found" }),
        { status: 404 }
      );
    }

    // Return the posts data in the response
    return new Response(
      JSON.stringify({ data: response }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch posts" }),
      { status: 500 }
    );
  }
}
