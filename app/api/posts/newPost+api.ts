import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const {
      content,
      clerkId,
      color = "yellow",
      emoji = null,
      expires_at,
      available_at,
      static_emoji,
      postType = "public",
      recipientId,
      promptId,
      boardId,
      formatting,
    } = await request.json();

    if (!content || !clerkId) {
      console.error("Missing required fields:", {
        content,
        clerkId,
        expires_at,
        available_at,
      });
      return Response.json(
        { error: "content and clerkId are required" },
        { status: 400 }
      );
    }

    console.log("Creating new post with data:", {
      content,
      clerkId,
      color,
      emoji,
      expires_at,
      available_at,
      static_emoji,
      postType,
      recipientId,
      promptId,
      boardId,
      formatting,
    });

    // Process the formatting field to ensure it's a valid PostgreSQL array
    let formattingArray = [];
    
    // Check if formatting is a string (which might happen with encryption)
    if (typeof formatting === 'string') {
      if (formatting.startsWith('##ENCRYPTION_FAILED')) {
        // If encryption failed, use an empty array
        console.log("Formatting encryption failed, using empty array");
        formattingArray = [];
      } else if (formatting.startsWith('U2FsdGVkX1') || formatting.startsWith('##FALLBACK##')) {
        // This is encrypted data, store it as is in the database
        console.log("Detected encrypted formatting data, storing as-is");
        
        // Store encrypted formatting as a string in the database
        const unread = postType === "personal";
        const [insertedPost] = await sql`
          INSERT INTO posts 
            (user_id, content, like_count, report_count, post_type, recipient_user_id, color, emoji, expires_at, available_at, static_emoji, prompt_id, board_id, unread, formatting_encrypted)
          VALUES 
            (${clerkId}, ${content}, 0, 0, ${postType}, ${recipientId}, ${color}, ${emoji}, ${expires_at}, ${available_at}, ${static_emoji}, ${promptId}, ${boardId}, ${unread}, ${formatting})
          RETURNING 
            id,
            user_id, 
            content, 
            like_count, 
            report_count, 
            created_at, 
            unread_comments, 
            pinned, 
            color, 
            emoji, 
            recipient_user_id,
            notified,
            expires_at, 
            unread,
            post_type
        `;
        
        console.log("inserted Posts", insertedPost);
        
        // Handle notifications
        if (
          postType === "personal" &&
          insertedPost.recipient_user_id !== clerkId &&
          insertedPost.unread
        ) {
          await sendNotification(insertedPost, clerkId);
        }
        
        return Response.json({ data: insertedPost }, { status: 201 });
      } else {
        // Try to parse the JSON string
        try {
          formattingArray = JSON.parse(formatting);
          if (!Array.isArray(formattingArray)) {
            formattingArray = [];
          }
        } catch (e) {
          console.error("Failed to parse formatting JSON:", e);
          formattingArray = [];
        }
      }
    } else if (Array.isArray(formatting)) {
      // If it's already an array, use it directly
      formattingArray = formatting;
    }

    const unread = postType === "personal";
    const [insertedPost] = await sql`
      INSERT INTO posts 
        (user_id, content, like_count, report_count, post_type, recipient_user_id, color, emoji, expires_at, available_at, static_emoji, prompt_id, board_id, unread, formatting)
      VALUES 
        (${clerkId}, ${content}, 0, 0, ${postType}, ${recipientId}, ${color}, ${emoji}, ${expires_at}, ${available_at}, ${static_emoji}, ${promptId}, ${boardId}, ${unread}, ${formattingArray})
      RETURNING 
        id,
        user_id, 
        content, 
        like_count, 
        report_count, 
        created_at, 
        unread_comments, 
        pinned, 
        color, 
        emoji, 
        recipient_user_id,
        notified,
        expires_at, 
        unread,
        post_type
    `;

    if (
      postType === "personal" &&
      insertedPost.recipient_user_id !== clerkId &&
      insertedPost.unread
    ) {
      await sendNotification(insertedPost, clerkId);
    }

    return Response.json({ data: insertedPost, status: 201 });
  } catch (error: unknown) {
    console.error("Database operation failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        error: "Failed to create post",
        ...(process.env.NODE_ENV === "development" && {
          details: errorMessage,
        }),
      },
      { status: 500 }
    );
  }
}

// Helper function to send notifications
async function sendNotification(insertedPost: any, clerkId: string) {
  try {
    const posterUser = await sql`
      SELECT 
        clerk_id,
        firstname,
        lastname,
        username,
        country,
        state,
        city
      FROM users 
      WHERE clerk_id = ${clerkId}
    `;

    // building notification object
    const notification = {
      ...insertedPost,
      ...posterUser[0],
    };

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SERVER_URL}/dispatch`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: insertedPost.recipient_user_id,
          type: "Posts",
          notification,
          content: notification,
        }),
      }
    );

    const data = await res.json();
    if (!data.success) {
      console.log(data.message!);
    } else {
      console.log("Successfully shot a message");
    }
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}
