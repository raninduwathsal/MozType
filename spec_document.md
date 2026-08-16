# Monkeytype Clean-Room Implementation Specification

This specification documents the exact features and technical implementation details required to clean-room engineer a typing test application matching the behavior of the English typing test and leaderboard features in Monkeytype.

## 1. Typing Test Modes & Core Logic

### 1.1 Test Modes
The application must support the following core test modes:
- **Time Mode**: A fixed duration countdown test (e.g., 15s, 60s). The test ends when the timer hits zero.
- **Words Mode**: A fixed word count test (e.g., 10, 50, 100 words). The test ends when all words are successfully typed.
- **Quote Mode**: A test where the user types a specific pre-defined quote (short, medium, long, or thicc).
- **Custom / Zen Modes**: Zen mode allows free-typing without limits. Custom mode allows pasting custom text.

### 1.2 State Management
The active typing test maintains a rich state tracked by a controller (`test-logic.ts`), including:
- **Event Log**: An array of events (keypresses, timer steps, composition events) appended continuously during the test.
- **Active Word Index**: The index of the word currently being typed.
- **Active Modifiers (Funboxes)**: Custom test mutators (e.g., blind mode, reverse order).
- **Validation**: Strict configuration rules (e.g., `lazyMode`, `punctuation`, `numbers`) that dictate if a test is eligible for the leaderboard.

User Flow, there is a button to start new session it asks for Name and user can Type their name and then hit enter to start the test. the user can keep trying to imporve their WPM by retrying the test untill new session button is pressed after that the username cant be taken again and highest score is finalised.
---

## 2. Sentence Generation & Randomization

### 2.1 Word Generation (`words-generator.ts`)
The test words are dynamically generated based on the selected mode:
- **Random Words (Time/Words Mode)**: Fetches words from a selected language dictionary (e.g., `english.json`).
  - **Randomization algorithm**: Words are pseudo-randomly selected from a weighted frequency list. 
  - **Dynamic loading**: To optimize performance, the client generates a limited buffer of words (e.g., 100 words) initially. As the user types and approaches the end of the buffer, a background task (`addWord()`) asynchronously generates and appends more words.
- **Quotes**: Quotes are fetched from a backend service and split by spaces into a word array.

### 2.2 Formatting & Modifiers
- **Punctuation & Numbers**: When the respective settings are enabled, the `WordsGenerator` intercepts plain dictionary words and pseudo-randomly injects capitalization, commas, periods, quotes, or numbers into the words before displaying them.
- **English Punctuation specifically**: Ensures that capitalization follows grammatical rules (e.g., capital letter after a period).

---

## 3. Typing Speed & Accuracy Testing

### 3.1 High-Precision Timer (`test-timer.ts`)
- **Implementation**: Uses a recursive, self-adjusting `requestAnimationFrame`-based timer (via `animejs`'s `createTimer`) rather than standard `setInterval` to prevent time drift.
- **Tick Interval**: The timer ticks exactly every 1000ms (1 second).
- **Drift Correction**: On each tick, the timer compares `performance.now()` against the expected fire time (`timerStartMs + ticks * 1000`). If a tick is missed due to browser throttling (lag/tab backgrounding), a "catch-up" tick is emitted instantly.
- **Step Events**: Each tick emits a "step" event appended to the `EventLog`.

### 3.2 Metrics Calculation (`events/stats.ts` & `result.ts`)
At the end of a test, metrics are calculated deterministically by replaying the `EventLog`:
- **WPM (Words Per Minute)**: Calculated as `(correct_chars / 5) / (duration_in_seconds / 60)`. A "word" is strictly standardized as 5 keystrokes.
- **Raw WPM**: Calculated as `(all_typed_chars / 5) / (duration_in_seconds / 60)`. This includes incorrect and extra keystrokes.
- **Accuracy**: Calculated as `(correct_keystrokes / total_keystrokes) * 100`.
- **Consistency**: Uses the Coefficient of Variation (Standard Deviation / Mean). It measures the WPM at each 1-second interval bucket, calculates the standard deviation across all buckets, divides by the mean WPM, and converts to a percentage (using a custom `kogasa` curve mapping).
- **Burst History**: Calculates the WPM for every single word individually by looking at the timestamp of the first keypress and the spacebar keypress.

---

## 4. Leaderboard & Personal Bests

### 4.1 Qualification Rules (`pb.ts`)
A test result only qualifies for the global leaderboard if it meets strict anti-cheat and configuration criteria:
- **Mode Requirement**: Must be exactly `mode = time` AND `mode2 = 15` or `mode2 = 60`.
- **Language**: Must be `english`.
- **Modifiers**: Must have `lazyMode = false` and no invalidating "funboxes" enabled.

### 4.2 Local and Database Update
When a user completes a test:
1. **Local State**: The frontend checks if the WPM beats the local record for that exact configuration (`time`, `15s`, `english`). If yes, it shows a pending "Crown" UI icon.
2. **Backend Submission**: The frontend submits the result to the backend `api/controllers/result.ts`.
3. **Database Storage (`dal/user.ts`)**: The backend verifies the anti-cheat metrics. If valid, the new result is saved directly into the user document under a highly nested dictionary path: `lbPersonalBests.time["15"].english = PersonalBest{wpm, acc, raw, timestamp}`.

### 4.3 Leaderboard Aggregation (`dal/leaderboards.ts`)
The global leaderboard is NOT generated on-the-fly due to scaling constraints.
- **Scheduled Aggregation Jobs**: A backend worker (`update-leaderboards.ts`) runs a MongoDB aggregation pipeline on the `users` collection periodically.
- **Pipeline Logic**:
  1. `$match`: Filters for users where `lbPersonalBests.time["15"].english.wpm > 0` and `banned != true`.
  2. `$sort`: Sorts the matched users by `wpm` (descending), then `acc` (descending), then `timestamp` (descending).
  3. `$project`: Extracts only the username, UID, badge info, premium status, and the specific PB stats.
  4. `$setWindowFields` / `$addFields`: Calculates and injects the absolute `rank` integer (row number) for each user.
  5. `$out`: Writes the entire ordered result set into a dedicated cached collection: `leaderboards.english.time.15`.
- **API Retrieval**: When a user visits the Leaderboard page, the frontend calls `getLeaderboard()`, which simply paginates over the pre-calculated `leaderboards.english.time.15` collection using a `$skip` and `$limit` query, returning instant results.

---

## 5. Frontend Architecture & Design

### 5.1 Hybrid Rendering Approach
The frontend heavily utilizes a hybrid approach tailored for maximum performance during typing:
- **Vanilla TypeScript for Core Typing**: The core typing loop (`test-ui.ts`) relies on direct, imperative DOM manipulation. Generating and updating thousands of `<letter>` and `<word>` HTML elements via a Virtual DOM (like React) would cause unacceptable input lag. Instead, Vanilla JS directly modifies class names (`correct`, `incorrect`) and DOM nodes in real-time.
- **SolidJS for Surrounding UI**: UI elements outside the hot-path (like Leaderboard pages, Modals, Settings, and Results screens) are implemented using SolidJS. SolidJS provides fine-grained reactivity and component-based architecture without the overhead of a Virtual DOM.

### 5.2 Caret and Scrolling
- The typing cursor (caret) is an absolutely positioned `div` element. Its position is constantly updated to match the `.getOffsetLeft()` and `.getOffsetTop()` of the currently active `<letter>` element.
- The UI features a "smooth line scrolling" mechanism. When the user finishes a line, the entire text container translates upwards smoothly, keeping the user's focus horizontally centered.

---

## 6. Single Node.js App Architecture (Full-Stack Proposal)

Instead of maintaining a separate API backend and SPA frontend, the application can be unified into a single Node.js monolithic application.

### 6.1 Framework Choice
- **SolidStart**: Given the heavy reliance on performance and the existing usage of SolidJS, **SolidStart** is the ideal meta-framework. It allows you to build a full-stack Node.js application while retaining the fine-grained reactivity of SolidJS.
- **Next.js (Alternative)**: Next.js is a robust alternative, but you must ensure the core typing test component opts out of React's render lifecycle (using `useRef` and direct DOM manipulation) to maintain 60fps responsiveness.

### 6.2 Architecture Flow
- **Unified Routing**: API routes (e.g., `/api/leaderboards`, `/api/results`) and frontend pages live in the same repository and run on the same Node.js server.
- **Database Access**: The server-side routes in SolidStart/Next.js connect directly to the database using an ORM (like Prisma) or a driver (like Mongoose), eliminating the need to deploy and manage a standalone Express backend.
- **Server-Side Rendering (SSR)**: The landing pages and static content are pre-rendered on the server for optimal SEO and initial load times, while the typing test itself hydrates into a fully interactive client-side application.

---

## 7. Deployment Technologies

To deploy the unified Node.js full-stack application, the following technology stack is recommended. **Note: For a new MVP, many of these are optional and can be introduced as you scale.**

- **Hosting & Compute (Platform as a Service)** - *Required*: 
  - **Vercel** or **Render**: Highly recommended for Next.js or SolidStart. They offer zero-configuration deployments, edge networking, and auto-scaling Node.js serverless functions.
  - **Docker / AWS ECS**: If you prefer containerized self-hosting, the app can be bundled into a Node.js Docker image and deployed to AWS ECS, Google Cloud Run, or a DigitalOcean Droplet.
- **Database** - *Required*: 
  - **MongoDB Atlas**: Fully managed MongoDB hosting. Handles the complex `$setWindowFields` aggregation pipelines needed for leaderboard generation without manual database tuning.
- **Caching & Rate Limiting (Redis / Upstash)** - *Optional for MVP*: 
  - Not needed initially. MongoDB is fast enough to serve leaderboard reads for a small user base.
  - **When you need it**: Becomes essential when you have thousands of users submitting results and checking the leaderboard simultaneously, or when you need to enforce strict rate-limiting for anti-cheat and API abuse prevention.
- **CDN (Cloudflare)** - *Optional for MVP*: 
  - Not strictly necessary initially. Modern hosting platforms like Vercel or Render automatically distribute your static assets (images, CSS, JS) via their built-in edge networks.
  - **When you need it**: Useful later for advanced DDoS protection, custom edge-caching rules, and managing heavy global traffic.
- **DNS (Custom Domain)** - *Optional for MVP*: 
  - If you do not have a custom domain (e.g., `mytypingtest.com`), you can simply use the free default URL provided by Vercel/Render (e.g., `my-typing-app.vercel.app`).
  - **When you need it**: Whenever you want a professional, branded URL.
