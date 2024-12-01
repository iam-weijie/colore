import { neon } from "@neondatabase/serverless";

// TODO: update this route to be able to only update properties
// that the user specifies - for example, updating email
// if only the email parameter is non-empty

// For now, it will only take the location
export async function PATCH(request: Request) {
  try {
    //console.log("Received PATCH request for conversations");
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { conversationId, message, timestamp} = await request.json();

    if (!conversationId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await sql`
      UPDATE conversations
      SET last_message=${message}, last_message_timestamp=${timestamp}
      WHERE id=${conversationId}
    
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 200, // successful update
    });
  } catch (error) {
    //console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
