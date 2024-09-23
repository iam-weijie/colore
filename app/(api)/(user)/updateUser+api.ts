import { neon } from "@neondatabase/serverless";

export async function PATCH(request: Request) {
  try {
    // TODO: Update this method to receive any fields in the user
    // table and update accordingly (currently hardcoded to location fields)
    // only
    console.log("Received PATCH request for user info.");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { country, state, city, clerkId } = await request.json();

    if (!country || !state || !city || !clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
        UPDATE users
        SET country = ${country}, state = ${state}, city = ${city}
        WHERE clerk_id = ${clerkId}`;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
