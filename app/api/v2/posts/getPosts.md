# 📚 `GET /api/v2/getPosts` Endpoint Documentation

This unified endpoint allows you to retrieve posts in four distinct **modes**, each with its own purpose, filtering behavior, and expected parameters:

- 🔒 `personal` – private posts sent directly to a recipient
- 👤 `user` – posts authored by a specific user
- 🌎 `public` – public posts from other users, optionally filtered by location
- 📈 `trending` – high-engagement public posts ranked by a scoring algorithm

---

## 📍 Endpoint

- **URL:** `/api/v2/getPosts`
- **Method:** `GET`
- **Content-Type:** `application/json`

---

## 🛠️ Query Parameters

| Parameter      | Type    | Required For           | Description                                                                                                                        |
|----------------|---------|------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `type`         | string  | ✅ all                 | Mode of the request. One of: `personal`, `user`, `public`, `trending`.                                                            |
| `user_id`      | string  | `personal`, `public`   | The ID of the user making the request (used to filter out self-posts and check friendships).                                      |
| `recipient_id` | string  | `personal`             | The ID of the user receiving the post (for personal messages).                                                                    |
| `id`           | string  | `user`, `trending`     | The ID of the target user (whose posts or trends are being fetched).                                                              |
| `number`       | number  | Optional (default: 25) | Maximum number of posts to return.                                                                                                |
| `page`         | number  | `user` (optional)      | Page number (zero-based) for paginated user post retrieval.                                                                       |
| `limit`        | number  | `user` (optional)      | Number of posts per page for pagination.                                                                                          |
| `exclude_ids`  | string  | Optional               | Comma-separated list of post IDs to exclude from the response.                                                                    |
| `mode`         | string  | `public`, `trending`   | Location filter: one of `city`, `state`, or `country`. Filters posts by viewer's matching geographic value.                      |

---

## 🔄 Mode-by-Mode Explanation

### 🔒 `type=personal`

**Use this to fetch posts privately addressed to a specific user.**

- **Target audience:** The `recipient_id` user.
- **Viewer context:** `user_id` is the viewer (used for friendship visibility).
- **Filters:** Automatically filters by expiry, visibility time, and friendship.
- **Use case:** Fetch inbox-style posts, like DMs or message board replies.

**Required parameters:**
- `type=personal`
- `user_id` (viewer)
- `recipient_id` (target user)

---

### 👤 `type=user`

**Fetch all posts authored by a single user, with optional pagination.**

- **Target audience:** Any public-facing profile (or user's own feed).
- **Viewer context:** Optional.
- **Filters:** None by default, but supports `exclude_ids`, `page`, and `limit`.
- **Use case:** Profile pages, dashboards, archives.

**Required parameters:**
- `type=user`
- `id` (author's user ID)

**Optional pagination:**
- `page=0`, `limit=25` (default)

---

### 🌎 `type=public`

**Retrieve public posts from users other than the viewer, with optional geolocation filtering.**

- **Target audience:** Global or regional user base.
- **Viewer context:** `user_id` is used to avoid self-posts and apply geolocation filtering.
- **Filters:** Can limit by same `city`, `state`, or `country` as the viewer via `mode`.
- **Use case:** Explore feeds, homepage suggestions, nearby content.

**Required parameters:**
- `type=public`
- `user_id` (viewer)

**Optional filters:**
- `mode=city` / `state` / `country`
- `exclude_ids=101,102,...`

---

### 📈 `type=trending`

**Return the most relevant and active public posts, scored by a trending algorithm.**

- **Target audience:** Same as `public`, but with additional scoring to prioritize freshness and popularity.
- **Viewer context:** `id` is used to locate user and apply geolocation filters.
- **Scoring formula:**
```
trending_score = (likes × 0.7 + reports × -0.4)
                 ÷ (hours_since_created + 1.2)
```

- **Use case:** "Trending now", recommendation feeds, top 10 lists.

**Required parameters:**
- `type=trending`
- `id` (viewer ID for location filtering)

**Optional:**
- `mode=city` / `state` / `country`
- `exclude_ids=201,202,...`

---

## 📦 Response Structure

### `personal`, `public`, `trending`:

```json
{
  "posts": [
    {
      "id": "post_123",
      "user_id": "user_abc",
      "firstname": "Alice",
      "lastname": "Doe",
      "username": "alice.doe",
      "content": "Hello world!",
      "created_at": "2025-06-21T15:24:10Z",
      "city": "Toronto",
      "state": "ON",
      "country": "Canada",
      "like_count": 23,
      "report_count": 1,
      "unread_comments": 3,
      "recipient_user_id": null,
      "pinned": false,
      "color": "#FAEBD7",
      "emoji": "🌸",
      "prompt_id": "prompt_001",
      "prompt": "What's on your mind?",
      "board_id": null,
      "reply_to": null,
      "unread": false,
      "available_at": null,
      "expires_at": null,
      "position": { "top": 80, "left": 130 },
      "formatting": [],
      "static_emoji": "💬",
      "trending_score": 12.5843  // Only present if type=trending
    }
  ]
}
```

---

### `user` mode:

```json
{
  "posts": [ /* same as above */ ],
  "pagination": {
    "page": 0,
    "limit": 25,
    "total": 300,
    "hasMore": true
  }
}
```

---

## 🚫 Error Handling

| Status | Message                                | Cause                                              |
|--------|----------------------------------------|----------------------------------------------------|
| 400    | `"Missing 'type' parameter"`           | The `type` query parameter is required             |
| 400    | `"recipient_id and user_id required"`  | `personal` requests require both parameters        |
| 400    | `"Invalid 'type' parameter"`           | The `type` is not one of the allowed values        |
| 500    | `"Failed to fetch posts"`              | Internal server/database error occurred            |

---

## ✅ Summary

The `/api/v2/getPosts` endpoint supports four flexible modes for fetching posts:

| Mode      | Description                        | Best Used For                    |
|-----------|------------------------------------|----------------------------------|
| `personal`| Private posts between two users    | DMs, inbox, direct messages      |
| `user`    | Authored posts by a single user    | Profile feeds, history, archives|
| `public`  | Random public content              | Discovery feeds, regional views |
| `trending`| Scored high-engagement public posts| Trending lists, home feed top 10|

---