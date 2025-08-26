import { sendNotification } from "@/lib/notification";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    const { clerkId, postId, postClerkId, content, replyId } =
      await request.json();

    if (!clerkId || !postId || !postClerkId || !content) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // When the comment is from someone other than the post owner
    if (clerkId !== postClerkId) {
      
      // First insert the comment
      const insertedComment = await sql`
        INSERT INTO comments (user_id, post_id, content, reply_comment_id)
        VALUES (${clerkId}, ${postId}, ${content}, ${replyId})
        RETURNING id;
      `;

      // Then increment the unread_comments counter
      await sql`
        UPDATE posts
        SET unread_comments = unread_comments + 1
        WHERE id = ${postId};
      `;

      // Fetch data needed for notification + display-name logic
      const [post, comment, commenter, postOwner, friendship] = await Promise.all([
        sql/*sql*/`
          SELECT id, content, created_at, user_id, like_count, report_count, unread_comments, color, post_type, board_id
          FROM posts
          WHERE id = ${postId};
        `,
        sql/*sql*/`
          SELECT id, content AS comment_content, created_at AS comment_created_at, like_count AS comment_like_count, report_count AS comment_report_count, notified
          FROM comments
          WHERE id = ${insertedComment[0].id};
        `,
        // include nickname + incognito_name for display rule
        sql/*sql*/`
          SELECT firstname, username, nickname, incognito_name
          FROM users
          WHERE clerk_id = ${clerkId};
        `,
        // include incognito_name for personal posts
        sql/*sql*/`
          SELECT firstname, username, nickname, incognito_name, push_token
          FROM users
          WHERE clerk_id = ${postClerkId};
        `,
        // determine friendship (viewer = post owner, target = commenter)
        sql/*sql*/`
          SELECT EXISTS(
            SELECT 1
            FROM friendships f
            WHERE
              (f.user_id = ${postClerkId} AND f.friend_id = ${clerkId})
              OR
              (f.friend_id = ${postClerkId} AND f.user_id = ${clerkId})
          ) AS are_friends;
        `,
      ]);

      const p = post[0];
      const c = comment[0];
      const cm = commenter[0];
      const po = postOwner[0];
      const areFriends = Boolean(friendship?.[0]?.are_friends);

      // Unified display-name helper
      const getDisplayName = (
        target: { username?: string | null; nickname?: string | null; incognito_name?: string | null },
        postType: string,
        isFriend: boolean
      ) => {
        if (postType === "personal") {
          // hard override for personal posts
          return target.incognito_name ?? target.username ?? "";
        }
        // friendship rule
        return (isFriend ? target.nickname : undefined) ?? target.username ?? "";
      };

      // Viewer is the post owner (recipient of the notification)
      const commenterDisplay = getDisplayName(cm, p.post_type, areFriends);

      // For the post owner field in the payload, apply personal override only.
      // (Viewer == owner; friendship rule doesn't apply to self.)
      const postOwnerDisplay =
        p.post_type === "personal"
          ? (po.incognito_name ?? po.username ?? "")
          : areFriends ? (po.nickname) : (po.username ?? "");

      const new_comment = {
        id: c.id,
        comment_content: c.comment_content,
        comment_created_at: c.comment_created_at,
        comment_like_count: c.comment_like_count,
        comment_report_count: c.comment_report_count,
        notified: c.notified,
        commenter_firstname: cm.firstname, 
        commenter_username: commenterDisplay,
        is_liked: false,
      };

      const notification = {
        post_id: p.id,
        content: p.content,
        firstname: po.firstname, 
        username: postOwnerDisplay,
        created_at: p.created_at,
        user_id: p.user_id,
        like_count: p.like_count,
        report_count: p.report_count,
        unread_comments: p.unread_comments,
        color: p.color,
        comments: [new_comment],
      };

      await sendNotification(
        postClerkId,
        "Comments",
        notification,
        new_comment,
        po?.push_token
      );

      return new Response(JSON.stringify({ data: insertedComment[0] }), {
        status: 201,
      });
    } else {
      // When the post owner comments on their own post
      const response = await sql`
        INSERT INTO comments (user_id, post_id, content, reply_comment_id, notified)
        VALUES (${clerkId}, ${postId}, ${content}, ${replyId}, true)
        RETURNING id;
      `;
      return new Response(JSON.stringify({ data: response[0] }), {
        status: 201,
      });
    }
  } catch (error) {
    console.error("Error creating comment:", error);
    return Response.json(
      {
        error: "Failed to create comment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
