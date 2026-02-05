---
name: ""
overview: ""
todos: []
isProject: false
---

# Collector first message UX (Option A + fallback + intro rule)

## Goal

1. **Fallback message** (any time a default must appear): **"Welcome to Cardzzz ✦"**
2. **Option A**: Show only the generative welcome—no placeholder swap. Show loading in the chat area until GET /api/chat/welcome returns, then mount the chat with that message as the only first message.
3. **Collector welcome content**: The LLM-generated welcome must **(a)** open with a **3–6 word intro that introduces Cardzzz** in a generative way (e.g. "Welcome to Cardzzz", "Cardzzz — your dream cards", etc.), then **(b)** continue with the existing creative welcome logic (on-brand, different every time, invite into the conversation).

---

## 1. Fallback: "Welcome to Cardzzz ✦"

- Any place that shows a default/fallback first message (e.g. API failure, or legacy paths) must use exactly: **"Welcome to Cardzzz ✦"**
- Applied in: [useChatLogic.ts](src/hooks/useChatLogic.ts) (default initial message for collector when no initialWelcome), and in [Chat.tsx](src/components/Chat.tsx) when setting a fallback after welcome fetch failure (if we set one).

---

## 2. Option A: Generative message only from the start

**Chat.tsx**

- When `sessionId && currentScreen === "chat"` and **welcomeMessage === null**: render navbar + a **loading state** in the scroll area (e.g. "Loading..." or a single shimmer/skeleton) instead of the message list. Do not mount the chat message list with a placeholder.
- When **welcomeMessage** is set (or fetch fails—use fallback below): render the full chat and pass `apiOptions` with `initialWelcome: welcomeMessage` (or fallback `"Welcome to Cardzzz ✦"` on error).
- On welcome API failure: set `welcomeMessage` to the fallback string so the chat still renders with one message.

**useChatLogic.ts**

- **Initial state:** When `apiOptions?.mode === "collector"` and `apiOptions?.initialWelcome` is truthy, set initial `messages` to a single AI message with that text. Otherwise (e.g. editor mode, or collector without initialWelcome) use current defaults—and for collector without initialWelcome use the fallback **"Welcome to Cardzzz ✦"** as the first message text.
- **Remove** the useEffect that replaces the first message when `initialWelcome` arrives (the one using `welcomeAppliedRef` and `setMessages(prev => [{ ...prev[0], text: apiOptions.initialWelcome! }, ...])`).

Result: User sees loading, then a single generative welcome (or fallback). No swap.

---

## 3. Collector welcome: 3–6 word Cardzzz intro + existing logic

The generated welcome must:

1. **Start** with a short (3–6 word) phrase that introduces Cardzzz in a generative way (not a fixed script).
2. **Then** continue with the same creative, on-brand, different-every-time welcome that already exists.

**Implementation**

- In [collector.ts](src/lib/agents/collector.ts), update **WELCOME_PROMPT** (and/or the instruction in the system/intention) so the LLM is told explicitly:
  - First sentence (or opening phrase): 3–6 words that introduce Cardzzz (e.g. "Welcome to Cardzzz", "Cardzzz — dream cards for someone you love", etc.). Generative, not identical every time.
  - Then: the rest of the message follows the existing logic (creative, on-brand, Digital Confidant, one short message, different every time).
- Optional: add one line to [collector-intention/intention.md](.cursor/rules/brand/collector-intention/intention.md) under "Opening message": the welcome must open with a 3–6 word phrase that names Cardzzz, then continue with the creative welcome.

**Example shape:** "Welcome to Cardzzz — [rest of creative, varied welcome and invitation]."

---

## 4. Files to change


| Item                   | File                             | Change                                                                                                                                                                        |
| ---------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fallback copy          | useChatLogic.ts                  | Default collector first message text = "Welcome to Cardzzz ✦"; initial state uses initialWelcome when present, else this fallback for collector.                              |
| Fallback on API error  | Chat.tsx                         | On fetch catch or non-ok response, set welcomeMessage to "Welcome to Cardzzz ✦" so chat still shows.                                                                          |
| Option A loading       | Chat.tsx                         | When sessionId && currentScreen === "chat" && welcomeMessage === null, show loading in scroll area; when welcomeMessage set, render full chat with apiOptions.initialWelcome. |
| Option A initial state | useChatLogic.ts                  | Collector + initialWelcome → initial messages = single message with that text. Remove replace effect.                                                                         |
| 3–6 word intro         | collector.ts                     | Update WELCOME_PROMPT to require opening 3–6 words introducing Cardzzz, then existing creative welcome.                                                                       |
| Optional               | collector-intention/intention.md | State that opening message must start with 3–6 word Cardzzz intro, then creative welcome.                                                                                     |


---

## 5. Summary

- **Fallback everywhere:** "Welcome to Cardzzz ✦"
- **UX:** Loading in chat area until welcome is ready, then one generative message (no swap).
- **Content:** Generative welcome = [3–6 word Cardzzz intro] + [existing creative welcome].

