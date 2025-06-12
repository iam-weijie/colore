# Coloré 🎨

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm start

   ```

   or

   ```bash
   npx expo -c
   ```

   to clear the cache

## Issues and Feature Requests

To get an overview of the tasks and new features we're working on, please check out the [Issues List](https://github.com/iam-weijie/colore/issues) on GitHub. Follow these steps to get started:

1. **Select an Issue:** Browse the list of open issues to get a general idea of the tasks available.
2. **Leave Comments:** If you need clarification on any issue, feel free to leave a comment under the specific issue, and we'll address it as soon as possible.
3. **Claim an Issue:** Once you're ready to work on an issue, assign it to yourself or leave a comment to claim it so that others know you're working on it.

## Tech Stack

- Framework - [Expo](https://expo.dev/)
- Language - [TypeScript](https://www.typescriptlang.org)
- Auth - [Clerk](https://clerk.com/)
- Database - [Neon Postgres](https://neon.tech/home)
- Styling - [NativeWind](https://www.nativewind.dev/)
- Formatting - [Prettier](https://prettier.io)

## End-to-End Encryption

Coloré encrypts all personal posts and private-board metadata on the client. The server never sees plaintext.

Workflow
1. On sign-up a 16-byte random salt is generated and stored in the `users.salt` column.
2. On login the salt is fetched; the entered password + salt are fed to PBKDF2 (10 000 iterations) to derive a 256-bit AES key. The key lives only in memory (`GlobalContext.encryptionKey`) and is wiped on logout.
3. When a post is personal (`recipient_user_id` set) or a board is marked **Private**, `content`, `formatting`, `title`, and `description` are encrypted with `AES-256-CBC` (via `crypto-js`).
4. On fetch, the client decrypts those fields using the in-memory key before rendering.

Key Files
- `lib/encryption.ts` → salt generation, PBKDF2 derivation, `encryptText`, `decryptText` helpers.
- `app/auth/sign-up.tsx` / `log-in.tsx` → key creation & storage.
- `lib/post.ts` → encrypt personal post payload.
- `app/root/new-board.tsx` & gallery / board detail components → encrypt/decrypt board metadata.
- `hooks/usePersonalBoard.ts` → decrypt personal posts when reading.

Testing
Run `npm test` to build a node-only bundle of `lib/encryption` and execute unit tests in `__tests__/encryption.node.test.js` ensuring round-trip correctness and wrong-key failure.
