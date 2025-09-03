# New Post Folder Structure

This folder contains the modular post creation system broken down into different post types and shared components.

## Structure

```
app/root/new-post/
├── _layout.tsx          # Stack layout for all post routes
├── index.tsx            # Default new post creation
├── edit.tsx             # Edit existing posts
├── personal.tsx         # Personal posts (directed to specific users)
├── temporary.tsx        # Temporary posts with expiration
├── global.tsx           # Global posts for the feed
├── prompt.tsx           # Posts responding to prompts
└── README.md           # Documentation

hooks/
└── usePostCreation.ts   # Shared hook for post creation logic

components/new-post/
├── index.ts            # Component exports
├── PostCreationUI.tsx   # Shared UI component
├── PostSettings.tsx     # Settings modal component
└── utils.ts            # Shared utilities and types
```

## Post Types

### Index (`/root/new-post`)
- Default new post creation
- Handles all post types based on parameters
- Uses shared components and hooks

### Edit (`/root/new-post/edit`)
- For editing existing posts
- Pre-populated with post data
- "Save Changes" button instead of "New Post"

### Personal (`/root/new-post/personal`)
- Posts directed to specific users
- "Send to User" button
- Recipient selection functionality

### Temporary (`/root/new-post/temporary`)
- Posts with expiration dates
- "Create Temporary" button
- Automatic expiration handling

### Global (`/root/new-post/global`)
- Posts for the global feed
- "Post Globally" button
- No specific recipient

### Prompt (`/root/new-post/prompt`)
- Posts responding to prompts
- "Answer Prompt" button
- Prompt-specific functionality

## Shared Components

### usePostCreation Hook (`hooks/usePostCreation.ts`)
- Centralized state management
- Common handlers for all post types
- Draft post management
- Navigation logic

### PostCreationUI Component (`components/new-post/PostCreationUI.tsx`)
- Shared UI layout
- Color picker, emoji selector, text input
- Preview functionality
- Responsive design

### PostSettings Component (`components/new-post/PostSettings.tsx`)
- Settings modal for all post types
- Recipient selection
- Scheduling and expiration
- Reply functionality

## Navigation

The system uses the `lib/postNavigation.ts` utility for consistent navigation:

```typescript
import { navigateToPost, navigateToNewPost, navigateToEditPost } from "@/lib/postNavigation";

// Smart routing based on parameters
navigateToPost({ postId: "123", content: "..." });

// Direct routing to specific types
navigateToEditPost({ postId: "123", content: "..." });
navigateToPersonalPost({ recipientId: "user123", username: "john" });
```

## Benefits

1. **Modularity**: Each post type has its own file with specific logic
2. **Code Reuse**: Shared components and hooks reduce duplication
3. **Maintainability**: Easier to modify specific post types
4. **Type Safety**: Better TypeScript support with specific interfaces
5. **Navigation**: Consistent routing with smart parameter detection
6. **Scalability**: Easy to add new post types in the future
7. **Organization**: Proper separation of concerns with hooks in `/hooks` and components in `/components`
