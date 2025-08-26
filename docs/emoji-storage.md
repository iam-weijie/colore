# Emoji Preferences Dual Storage System

This document explains how the shorthand emoji preferences are stored and synchronized between device storage and the database.

## Overview

The emoji preferences system uses a dual storage approach to ensure:
1. **Fast access** to emojis on the device (AsyncStorage)
2. **Persistence across devices** via database storage
3. **Automatic synchronization** between storage locations
4. **Fallback mechanisms** when one storage location fails

## Architecture

### Storage Locations

1. **Device Storage (AsyncStorage)**
   - File: `lib/emojiStorage.ts`
   - Key format: `shorthand_emojis_{userId}`
   - Purpose: Fast local access, offline functionality

2. **Database Storage**
   - Table: `users.shorthand_emojis` (JSONB column)
   - API: `/api/users/updateEmojiPreferences`
   - Purpose: Cross-device persistence, backup

### Core Components

1. **EmojiStorage Class** (`lib/emojiStorage.ts`)
   - Manages device-side AsyncStorage operations
   - Provides validation and error handling
   - Includes debugging utilities

2. **useEmojiPreferences Hook** (`hooks/useEmojiPreferences.ts`)
   - Coordinates between device and database storage
   - Handles synchronization logic
   - Manages UI state updates

3. **Database API** (`app/api/users/updateEmojiPreferences+api.ts`)
   - Handles CRUD operations for emoji preferences
   - Validates data integrity
   - Provides error handling and feedback

## How It Works

### Loading Preferences

1. **Primary Source**: Device storage (fastest)
2. **Fallback**: Database storage (if device has no custom emojis)
3. **Default**: Hardcoded default emojis (if both fail)

```typescript
// Priority order:
1. Device storage (if has custom emojis)
2. Database storage (if device has no custom emojis)
3. Default emojis (if both fail)
```

### Saving Preferences

1. **Parallel Save**: Attempts to save to both locations simultaneously
2. **Success Handling**: Updates UI if at least one location succeeds
3. **Warning Logs**: Logs warnings if only one location succeeds
4. **Error Handling**: Returns false only if both locations fail

```typescript
const [deviceSuccess, databaseSuccess] = await Promise.allSettled([
  EmojiStorage.saveUserShorthandEmojis(user.id, emojis),
  saveToDatabase(user.id, emojis)
]);
```

### Synchronization

The system automatically syncs preferences when:
- Loading preferences (database → device if needed)
- Saving preferences (device ↔ database)
- Resetting preferences (both locations)
- Clearing preferences (both locations)

## Error Handling

### Partial Failures

- **Device succeeds, database fails**: Emojis saved locally, warning logged
- **Database succeeds, device fails**: Emojis saved remotely, warning logged
- **Both fail**: Operation fails, error logged

### Fallback Mechanisms

- Invalid data in device storage → Use database or defaults
- Database unavailable → Use device storage or defaults
- Both unavailable → Use hardcoded defaults

## Usage Examples

### Basic Usage

```typescript
const { 
  shorthandEmojis, 
  saveEmojiPreferences, 
  syncEmojiPreferences 
} = useEmojiPreferences();

// Save new preferences
await saveEmojiPreferences(['😊', '❤️', '👍', '😂', '🔥', '🥳']);

// Force sync between device and database
await syncEmojiPreferences();
```

### Advanced Usage

```typescript
// Check storage status
const status = await EmojiStorage.getStorageStatus(userId);
console.log('Storage status:', status);

// Manual database save
const success = await saveToDatabase(userId, emojis);

// Clear all preferences
await clearEmojiPreferences();
```

## Database Schema

```sql
ALTER TABLE users ADD COLUMN shorthand_emojis JSONB DEFAULT NULL;
```

The `shorthand_emojis` column stores:
- `null`: No custom preferences (use defaults)
- `["emoji1", "emoji2", ...]`: Array of exactly 6 emoji strings

## Testing

Run the test suite to verify functionality:

```bash
npm test __tests__/emojiStorage.test.ts
```

Tests cover:
- Device storage operations
- Database API operations
- Error handling scenarios
- Synchronization logic

## Troubleshooting

### Common Issues

1. **Emojis not syncing across devices**
   - Check database connection
   - Verify user authentication
   - Check API endpoint availability

2. **Device storage corruption**
   - Use `syncEmojiPreferences()` to restore from database
   - Check AsyncStorage permissions
   - Verify storage key format

3. **Database errors**
   - Check `shorthand_emojis` column exists
   - Verify database permissions
   - Check API endpoint configuration

### Debug Tools

```typescript
// Get detailed storage status
const status = await EmojiStorage.getStorageStatus(userId);

// Check if emojis are valid
const isValid = await EmojiStorage.hasValidEmojis(userId);

// Force refresh from database
await refreshEmojiPreferences();
```

## Performance Considerations

- **Device storage**: Instant access, no network latency
- **Database storage**: Network latency, but cross-device persistence
- **Parallel operations**: Both storage operations happen simultaneously
- **Caching**: Device storage acts as a fast cache layer

## Security

- User-specific storage keys prevent cross-user data access
- Database operations require valid user authentication
- Input validation ensures data integrity
- No sensitive data stored in emoji preferences
