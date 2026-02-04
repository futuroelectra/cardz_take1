---
name: Master prompt backend spec
overview: Create a single, exhaustive master prompt document that maps all three user flows (sender, receiver, returning user) to exact front-end elements and backend behavior, so an agent can one-shot the backend implementation with no ambiguity. The document will reference existing pages/components by file and CSS class, and mandate adherence to cursor rules for any new UI.
todos: []
isProject: false
---

# Master Prompt: Backend Logic and Front-End Mapping

## Goal

Produce **one** master prompt document that:

- Deconstructs the full conversation/transcript into **sender**, **receiver**, and **returning user** flows with no ambiguity.
- Maps **every meaningful button and interaction** to exact UI elements (component, file, class/label).
- Specifies **backend behavior** (auth, payment, iteration limits, notifications, async jobs, security) so the backend can be implemented in one pass.
- Instructs to **reuse** existing components (after housekeeping: moved out of quarantine and renamed) and follow [.cursor/rules/ui-styling.mdc](.cursor/rules/ui-styling.mdc) for any new or replicated screens/modals.

---

## 0. Housekeeping (before or alongside master doc)

- **Move components out of quarantine** and give **intuitive names**: remove the `Raw` prefix and any quarantine-only naming so components are discoverable and self-explanatory (e.g. RawChat → Chat, RawEditorChat → EditorChat, RawLoadingSignup → LoadingSignup, etc.). Move files from `src/app/_quarantine/` into a proper structure (e.g. `src/components/` or `src/app/components/` as defined by the new structure rule).
- **New cursor rule: directory structure and naming**: Create a cursor rule that defines (1) how we structure directories (e.g. pages vs components vs hooks), (2) how we name files (kebab-case, no Raw prefix, descriptive), (3) how we name components (PascalCase, intuitive), and (4) how we name exports. This rule should make the system easy to reproduce so any new flow or screen follows the same layout and naming conventions.

---

## 1. Document location and format

- **Path**: `docs/MASTER_PROMPT_BACKEND.md` (create `docs/` if needed). Alternative: project root `MASTER_PROMPT_BACKEND.md` if you prefer a single file at top level.
- **Format**: Markdown, with clear sections and **required** mermaid flow diagrams for the three flows (see Section 8).
- **Reference**: Point to `.cursor/rules/ui-styling.mdc` and `.cursor/rules/cursor-rules.mdc` as the single source of truth for typography, glassmorphism, button states, and naming (`Comp_`, `Layout_`, `Chat_`). Align and embed references to these within the master doc so the master doc is the single entry point.

---

## 2. Current app structure (to be codified in the doc)

**Routes and components:**

| Route                    | Page component                                                                   | Main raw component                                                                               |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/`                      | [src/app/page.tsx](src/app/page.tsx)                                             | [RawChat](src/app/_quarantine/RawChat.tsx) (landing = chat)                                      |
| `/collection`            | [src/app/collection/page.tsx](src/app/collection/page.tsx)                       | [RawCollection](src/app/_quarantine/RawCollection.tsx) (empty state)                             |
| `/collection-with-cards` | [src/app/collection-with-cards/page.tsx](src/app/collection-with-cards/page.tsx) | [RawCollectionWithCards](src/app/_quarantine/RawCollectionWithCards.tsx) (grid + activate modal) |
| `/settings`              | [src/app/settings/page.tsx](src/app/settings/page.tsx)                           | [RawSettings](src/app/_quarantine/RawSettings.tsx)                                               |

**Modals / full-screen flows:**

- [RawNavMenuModal](src/app/_quarantine/RawNavMenuModal.tsx): links "create" → `/`, "collection" → `/collection-with-cards`, "settings" → `/settings`.
- [RawPaywallModal](src/app/_quarantine/RawPaywallModal.tsx): "limit reached", $5 CTA; used from chat/editor when iteration limit hit (and at export if needed).
- [RawActivateModal](src/app/_quarantine/RawActivateModal.tsx): "reactivate dream-card" $5 or subscribe; used when opening an expired card in library.
- [RawLoadingSignup](src/app/_quarantine/RawLoadingSignup.tsx): sign-up form (name, email, password) + "create account" button; loading phase with rotating phrases; then navigates to editor.

**Chat logic:** [useChatLogic](src/app/_quarantine/useChatLogic.ts): message types `confirmation`, `export`; mock triggers for "confirmation" / "export" / "pop" (paywall). These become the hooks for real backend (first draft → confirmation → approve → editor → export).

The master prompt must state that **library** in the product sense is the **collection-with-cards** view (menu item "collection" goes to `/collection-with-cards`). Decide in the doc whether `/collection` stays as empty state or is removed/redirected.

---

## 3. Content to include in the master prompt

### 3.1 Sender flow (step-by-step with element mapping)

- **Land on chat** (`/`, Chat): User lands on chat.
- **Section_Input** → textarea "Type your reply...", **Comp_Button-Primary** label "send", **Comp_Attach**, **Comp_Voice**. Send → backend: create session, 1–2 messages to get "just enough" for first iteration.
- **First iteration ready** → AI shows **Comp_Confirmation_Request** (Chat_bubble_ai) with button label **"approve"**. Optional sign-in modal here: "Do you want to sign in? All changes will be saved and you can come back." **Yes** → sign-up flow; **No** → "Skip for now" → optional **confirmation modal**: "Are you sure? Your session may not persist if you close or reload." Buttons: **Sign up** (then sign-up flow) or **Yes** (continue without account).
- **After approve (or skip)** → **Sign up** → LoadingSignup (sign-up flow); or **Skip** → straight to **EditorChat**. If user completes sign-up while the build runs, they can land in the editor when it’s ready.
- **Editor** (EditorChat): **Section_editor_canvas** (preview), **Section_chat_interface** with heading "final touches?", same input + **Comp_Button-Primary** "send". Iterate; optionally reveal more customization in copy. **Iteration limit**: token-cost cap — **~$0.50 new user**, **~$1.50 super user**; at limit show PaywallModal (Comp_Paywall_Button "$5").
- **Export** (Comp_Export_Request in editor): button label **"export"**. If **not signed in** → show sign-up modal (reuse RawLoadingSignup pattern or a modal variant) then payment; if **signed in** → payment then export. **Payment required before successful export** via **Lemon Squeezy** (no other provider for now). After payment: generate shareable link; then **share experience**.
- **Share experience**: When user clicks share, a **bottom sheet** slides up from the bottom (common modern pattern). The **whole panel** is dismissible by clicking outside or sliding down — not a small bar. The sheet presents **native-feel options** (email, WhatsApp, iMessage, etc.). Use an existing library for bottom-sheet share if suitable, or build from scratch; document the chosen approach. Optional **rich preview** (Spotify-style card) for the link.
- **Per-button notifications** (configured in builder chat): For buttons that can notify: (1) **Authenticate through your own WhatsApp** (messages from user’s WhatsApp); (2) **Authenticate through your own email** (messages from user’s email); (3) **In-app only** (experience appears only in-app, no external notification). No “from us only” option. Backend stores choice and contact (email or number) per button for when receiver triggers it.

**Documentation standard (SOP-style)**: Document each step as a **standard operating procedure (SOP)** and reusable asset. Over-communicate so we can learn from this build, feed docs into LLMs, and keep the process reproducible and automatable. For every step include: **screen/component name**, **file path**, **exact button label or class**, **user action**, **backend requirement** (API, persistence, job queue, etc.), and where helpful a short **rationale** so future readers (human or model) can replicate or extend without guessing.

### 3.2 Receiver flow

- **Entry**: Receiver gets link (email, WhatsApp, or iMessage). Link goes to a **private card view** (private route — see auth spaces below) (e.g. `/c/[cardId]` or `/r/[token]` — to be defined; no existing component yet).
- **Claim / unlock**: Receiver must claim the card before viewing. **Option A — Passphrase**: When sender shares, a secret passphrase is generated and sent only in the private message with the link; receiver enters it to unlock (brand as "secret passphrase to enter the experience"). **Option B — Sign up to claim**: First open shows e.g. "Sign up to claim the card"; receiver provides email/password to claim and lock the card (wording: "unlock your experience"). Link alone must not grant access.
- **After claim** → **activate card for 48 hours** (backend: mark active, set expiry, lock to user). Show **welcome message** (clear, separate from card content) so it’s obvious what the message is.
- **Card UI**: View card; **interactive buttons**. If a button has notification and receiver **submits** (e.g. submit on an input): backend sends message **from the sender** (WhatsApp or email as configured). Show "check your inbox soon" (or similar). Optionally show same content in-app after short delay.
- **Loading**: When an action is in progress (e.g. generating audio), show **non-blocking loading** (e.g. "cooking" / Lottie-style animation) so user can stay on page; optionally notify when done.

Map: **private route**, **claim (passphrase or sign-up)**, **activate CTA**, **per-button submit**, **loading state component** (reuse or mirror LoadingPhrases pattern). Specify backend: claim/lock, passphrase validation if used, activation endpoint, 48h window, notification dispatch (WhatsApp/email from sender). **Auth spaces**: Build = authenticated; library/collection = authenticated; profile/settings = authenticated; chat = usable without sign-in (anonymous or signed-in, same UI).

### 3.3 Returning user flow

- **Land on chat** (`/`) — same as sender entry. **Comp_menu_button** → **RawNavMenuModal** → "collection" → `/collection-with-cards`.
- **Library** ([RawCollectionWithCards](src/app/_quarantine/RawCollectionWithCards.tsx)): **Comp_Toggle_Option** "sent" / "received", **Section_cards_grid**, **Comp_card_preview** (grid items). Click card → if **within 48h and active** or **premium** → view + interact; if **expired** → **RawActivateModal** (Comp_Activate_Button "$5" or "subscribe in settings").
- **Settings** ([RawSettings](src/app/_quarantine/RawSettings.tsx)): **profile** (name, email), **password** (current, new, confirm; forgot password), **subscription** (subscribe / cancel), **notifications** toggles, **account management**: "export my data", "delete account". Add **personalization prompt** (per transcript). Subscription via Lemon Squeezy; backend stores customer/subscription state.

Document: **Comp_menu_button**, **Comp_NavMenu_Link** "create" | "collection" | "settings", **Comp_Toggle_Option**, **Comp_card_preview** click → backend (card status, premium check, activate/pay), **Comp_Activate_Modal** buttons, and each settings section with button labels and backend actions.

---

## 4. Element map (for one-shot implementation)

In the doc, add a **compact element map** so every button/click is findable:

- **Page or modal** → **Component (file)** → **Element (class or label)** → **Action** → **Backend**
- Example: `Chat` → `RawChat.tsx` → `Comp_Button-Primary_approve` (label "approve") → On click: persist approval, optionally show sign-in modal or go to editor → Backend: session/card state, auth check.

Cover: Chat (send, approve, export), optional sign-in and skip-confirmation modals, LoadingSignup (create account), Editor (send, approve, export, paywall), Paywall ($5), Nav menu (create, collection, settings), Collection (sent/received, card click), Activate modal ($5, close), Settings (update profile, update password, subscribe, cancel subscription, notification toggles, export data, delete account), and receiver view (activate, submit per button, loading).

---

## 5. Modals and variants

- **Sign-in optional** (after first "approve"): New modal or reuse pattern from RawLoadingSignup. Buttons: "Sign in" (→ sign-up flow) / "Skip for now" (→ optional "Are you sure?").
- **Skip confirmation**: "Are you sure? Session may not persist." Buttons: "Sign up" | "Yes" (continue). Reuse glassmorphism and button styles from [ui-styling.mdc](.cursor/rules/ui-styling.mdc).
- **Paywall at export**: Two variants if desired: (1) **Not signed up**: sign-up + payment; (2) **Signed up**: payment only. Reuse RawPaywallModal; copy/heading can vary by variant. Document exact copy and which variant shows when.
- **Activate modal**: Already in RawActivateModal; document that it appears when opening an expired card in library; $5 one-off or "subscribe in settings".

---

## 6. Notifications and backend

- **Rules**: Notifications are **per button**; options: from sender via **WhatsApp** (user must authenticate), from sender via **email**, or **no notification**. No notification from "us" only. When receiver triggers a notifying button: send via chosen channel from sender identity where possible; show "check inbox soon" and optionally mirror in-app.
- **Backend**: Async jobs for sending (email/WhatsApp), so the app stays responsive; user can keep using the app while a job runs; optional in-app or channel notification when done.

---

## 7. Non-functional requirements (in the doc)

- **Production-ready**: No placeholders; proper error handling, validation, and security.
- **Security**: Strong auth (e.g. session + device fingerprint for "handoff" continuity), encrypted sensitive data at rest and in transit; consider future-proofing (e.g. quantum-safe guidance if required).
- **Reuse**: Any new screen or modal must reuse or replicate patterns from [RawLoadingSignup](src/app/_quarantine/RawLoadingSignup.tsx), [RawPaywallModal](src/app/_quarantine/RawPaywallModal.tsx), [RawActivateModal](src/app/_quarantine/RawActivateModal.tsx), and follow [.cursor/rules/ui-styling.mdc](.cursor/rules/ui-styling.mdc). Extract reusable components (e.g. Comp_Button_Primary) where it avoids duplication.

---

## 8. Mermaid flow diagrams (required)

Flow diagrams are **required**, not optional. The master doc MUST include mermaid flow diagrams for:

- **Sender**: Land → Chat → Approve (optional sign-in/skip) → Editor → Iterate (paywall at limit) → Export (sign-up + payment if needed) → Share (bottom sheet: email/WhatsApp/iMessage).
- **Receiver**: Link → Claim (passphrase or sign-up) → Activate 48h → View card → Click button → Submit → Notification from sender (optional) + "check inbox soon".
- **Returning**: Land → Menu → Library → Card click → (active/premium: view; expired: Activate modal) or Settings (profile, password, subscription, delete).

---

## 9. Deliverable

- **Single file**: `docs/MASTER_PROMPT_BACKEND.md` (or root `MASTER_PROMPT_BACKEND.md`).
- **Sections**: (1) Purpose and design reference, (2) Routes and components, (3) Sender flow with element map, (4) Receiver flow with element map, (5) Returning user flow with element map, (6) Modals and variants, (7) Notifications and async behavior, (8) Security and reuse, (9) **Required** mermaid flow diagrams.
- **Tone**: Directive and unambiguous ("When the user clicks the button labeled 'approve' in Comp_Button-Primary_approve inside Chat, the backend MUST ..."). No room for interpretation on critical paths.

This gives you one reference that an agent (or human) can use to implement the backend and wire every button to the correct behavior while keeping the existing front-end and design system intact.

---

## 10. Cursor rules derived from the master doc (standardize going forward)

Align the **existing** cursor rules ([.cursor/rules/cursor-rules.mdc](.cursor/rules/cursor-rules.mdc), [.cursor/rules/ui-styling.mdc](.cursor/rules/ui-styling.mdc)) within the master doc so the master doc references them as the single source of truth. In addition, **create one cursor rule per major section** so that from this moment forward everything is standardized and we never have to re-ask how to approach each area:

| Section                            | Cursor rule purpose                                                                                                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Flows**                          | Define that the app consists of exactly **three flows** (sender, receiver, returning user). No additional or hallucinated flows; any new flow must be explicitly added to the spec and to this rule. |
| **Element maps**                   | Why element maps exist, how we build them, and how they are standardized (page → component → element → action → backend). Future screens/modals must have an element map entry.                      |
| **Modals and variants**            | How we build modals and variants (sign-in, skip confirmation, paywall, activate), how they interact with UI styling, and when to reuse vs create new.                                                |
| **Notifications and backend**      | How notifications work (per-button, WhatsApp/email from user or in-app only), how async backend jobs are used, and how this ties to the UI.                                                          |
| **Non-functional requirements**    | Security, production-readiness, reuse of components, and any NFRs we expect every build to meet.                                                                                                     |
| **Flow diagrams and deliverables** | How we approach mermaid flow diagrams (required for every flow), where they live, and how deliverables (e.g. master doc structure) are laid out.                                                     |
| **Directory structure and naming** | (See Section 0.) How we structure directories, name files (no Raw prefix, kebab-case, intuitive), name components, and name exports for easy reproduction.                                           |

Each of these should be a dedicated `.mdc` file in `.cursor/rules/` (e.g. `flows.mdc`, `element-maps.mdc`, `modals-variants.mdc`, `notifications-backend.mdc`, `non-functional-requirements.mdc`, `flow-diagrams-deliverables.mdc`, `directory-structure-naming.mdc`). The master doc should reference these rules so that implementation and future automation (e.g. feeding back into LLMs) stay consistent.
