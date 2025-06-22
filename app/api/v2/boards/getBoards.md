# 🧭 `GET /api/v2/getBoards` Endpoint Documentation

This unified endpoint allows clients to retrieve board data in three different **types**, with varying levels of privacy and audience filtering:

- 📝 `personal` – boards created by the requesting user
- 🤝 `community` – shared boards the user is a member of
- 🌍 `discover` – public boards visible to everyone

---

## 📍 Endpoint

- **URL:** `/api/v2/getBoards`
- **Method:** `GET`
- **Content-Type:** `application/json`

---

## 🛠️ Query Parameters

| Parameter   | Type   | Required For             | Description                                                                 |
|-------------|--------|--------------------------|-----------------------------------------------------------------------------|
| `type`      | string | ✅ all                   | One of: `personal`, `community`, `discover`. Defaults to `discover`.       |
| `user_id`   | number | `personal`, `community`  | ID of the requesting user (used to fetch authored or membered boards).     |

---

## 🔍 Type-by-Type Explanation

### 📝 `type=personal`

**Use this to fetch boards authored by the requesting user.**

- **Audience:** Private to the user who created them.
- **Filters:** Returns all boards where `user_id` matches the requester.
- **Use case:** Display user's own boards (e.g. profile, dashboard).

**Required parameters:**
- `type=personal`
- `user_id` (the board owner)

---

### 🤝 `type=community`

**Fetch shared boards the user is listed as a member of.**

- **Audience:** Boards shared with and visible to the user.
- **Filters:** Must have `restrictions` including `"Everyone"` and contain user in `members_id`.
- **Use case:** Collaboration boards, group feeds.

**Required parameters:**
- `type=community`
- `user_id` (requesting user)

---

### 🌍 `type=discover`

**Discover public boards created by any user.**

- **Audience:** Global.
- **Filters:** Boards must include `"Everyone"` in `restrictions`.
- **Use case:** Explore new public boards, trending pages, browse feeds.

**No parameters required** (but `type=discover` can be explicitly passed).

---

## 📦 Response Structure

```json
{
  "data": [
    {
      "id": 12,
      "title": "Design Squad",
      "description": "Post your UI/UX boards here!",
      "members_id": ["user_123", "user_456"],
      "user_id": "user_123",
      "board_type": "community",
      "restrictions": ["Everyone", "commentsAllowed"],
      "created_at": "2025-06-21T15:24:10Z",
      "count": 8,
      "isNew": true,
      "isPrivate": false,
      "commentAllowed": true,
      "imageUrl": ""
    }
  ]
}
```

---

## 🚫 Error Handling

| Status | Message                                 | Cause                                                              |
|--------|-----------------------------------------|--------------------------------------------------------------------|
| 400    | `"A valid user_id is required..."`      | If `user_id` is missing or invalid when required                   |
| 500    | `"Failed to fetch boards"`              | Generic internal server/database error                             |

---

## ✅ Summary

The `/api/v2/getBoards` endpoint provides a unified, flexible interface to retrieve different board types.

| Type        | Description                              | Best Used For                     |
|-------------|------------------------------------------|-----------------------------------|
| `personal`  | Boards created by the user               | Dashboards, profile boards        |
| `community` | Boards the user is a member of           | Collaboration, shared content     |
| `discover`  | Public boards visible to everyone        | Exploration, discover new boards  |

---
