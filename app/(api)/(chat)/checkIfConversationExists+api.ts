import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const userId1 = url.searchParams.get("id1");
    const userId2 = url.searchParams.get("id2");

    ////console.log("Received GET request for conversations between: ", userId1, " and ", userId2); 

    const response = await sql`
      SELECT * FROM conversations WHERE (clerk_id_1 = ${userId1} AND clerk_id_2 = ${userId2}) OR (clerk_id_2 = ${userId1} AND clerk_id_1 = ${userId2});`;
    return new Response(JSON.stringify({ data: response }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user posts." }),
      {
        status: 500,
      }
    );
  }
}
