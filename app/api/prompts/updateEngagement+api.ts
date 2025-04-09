import { neon } from "@neondatabase/serverless";

// Initialize connection outside the handler for better performance
const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(request: Request) {
  try {
    const { clerkId, promptId } = await request.json();

    if (!clerkId || !promptId) {
      return Response.json(
        { error: "Missing required fields: clerkId and promptId are required" },
        { status: 400 }
      );
    }

    // First verify the prompt exists and get current engagement
    const [prompt] = await sql`
      SELECT engagement, user_id 
      FROM prompts 
      WHERE id = ${promptId}
    `;

    if (!prompt) {
      return Response.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    // Optional: Verify the user owns the prompt if needed
    if (prompt.user_id !== clerkId) {
      return Response.json(
        { error: "Unauthorized - you can only update your own prompts" },
        { status: 403 }
      );
    }

    // Increment engagement by 1
    const [updatedPrompt] = await sql`
      UPDATE prompts
      SET engagement = COALESCE(engagement, 0) + 1
      WHERE id = ${promptId}
      RETURNING engagement
    `;

    return Response.json(
      { 
        data: {
          newEngagementCount: updatedPrompt.engagement,
          message: "Engagement count incremented successfully"
        }
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating engagement:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return Response.json(
      { 
        error: "Failed to update engagement",
        ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
      },
      { status: 500 }
    );
  }
}