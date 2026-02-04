/**
 * Shared types for backend logic per docs/MASTER_PROMPT_BACKEND.md.
 * Sender = creator of the card; Receiver = person who receives and controls the experience.
 */

// ----- Session & auth -----
export type SessionId = string;
export type UserId = string;
export type BuildId = string;
export type CardId = string;

export type Session = {
  id: SessionId;
  deviceId: string;
  userId?: UserId;
  createdAt: number;
  /** Collector phase: conversation for first draft */
  phase: "collector" | "approved" | "building" | "editor" | "exported";
  /** Number of user messages sent in collector (for completion check) */
  collectorUserMessageCount?: number;
  /** Full collector chat history for LLM and completion check */
  collectorMessages?: ChatMessage[];
  /** After approve: creative summary for Architect → Engineer */
  creativeSummary?: CreativeSummary;
  approvedAt?: number;
  /** Current build (card) being edited */
  buildId?: BuildId;
};

export type User = {
  id: UserId;
  email: string;
  name: string;
  /** Hashed; never stored plain */
  passwordHash: string;
  createdAt: number;
};

// ----- Collector output (Agent 1 → Architect) -----
export type CreativeSummary = {
  recipientName: string;
  senderName: string;
  senderVibe: string;
  /** What delivers the experience: avatar | object (card, orb, chest, etc.) */
  centralSubject: string;
  centralSubjectStyle?: string;
  tone: string;
  /** Brief product confirmation understood */
  productConfirmed: boolean;
  /** Optional extra from conversation */
  notes?: string;
};

// ----- Architect output (Agent 2 → Engineer) -----
export type ButtonSlot = {
  id: string;
  type: "text" | "music" | "image";
  label: string;
  /** Sender logic for task envelope (e.g. "only electronic") */
  senderLogic?: string;
  /** Notification: whatsapp | email | in_app_only */
  notification?: "whatsapp" | "email" | "in_app_only";
  contact?: string;
};

export type Blueprint = {
  heading: string;
  description: string;
  statusBar: string;
  centralImage: string;
  /** 1–4 buttons; at most one music, one image */
  buttons: ButtonSlot[];
  primaryBackground: string;
  secondaryBackground: string;
  textColor: string;
  themeName: string;
};

// ----- Engineer output (Agent 3) -----
export type BuildArtifact = {
  /** Serialized card UI (e.g. React component code or HTML) */
  code: string;
  blueprint: Blueprint;
  createdAt: number;
  /** For watcher: previous code before this iteration (if any) */
  previousCode?: string;
};

// ----- Build (card in progress or exported) -----
export type BuildStatus = "pending" | "ready" | "failed";

export type Build = {
  id: BuildId;
  sessionId: SessionId;
  userId?: UserId;
  status: BuildStatus;
  creativeSummary: CreativeSummary;
  blueprint?: Blueprint;
  artifact?: BuildArtifact;
  /** Token cost so far (editor phase); ~$0.50 new user, ~$1.50 super user cap */
  tokenCostCents: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
};

// ----- Card (exported, shareable) -----
export type CardStatus = "draft" | "exported" | "active" | "expired";

export type Card = {
  id: CardId;
  buildId: BuildId;
  ownerId: UserId;
  status: CardStatus;
  /** Shareable link token (e.g. /c/abc123) */
  shareToken: string;
  /** Secret passphrase for receiver claim (Option A) */
  passphrase?: string;
  /** When receiver claimed; 48h active from then */
  activatedAt?: number;
  claimedByUserId?: UserId;
  createdAt: number;
  exportedAt?: number;
  /** Generated card UI code for share view (Sandpack/preview) */
  code: string;
};

// ----- Chat message (API shape) -----
export type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "ai";
  type?: "confirmation" | "export";
  timestamp: string; // ISO
};

// ----- API request/response shapes -----
export type CreateSessionResponse = { sessionId: SessionId; deviceId: string };

export type ChatSendBody = { sessionId: SessionId; text: string };
export type ChatSendResponse = {
  messages: ChatMessage[];
  limitReached?: boolean;
  /** Pop when backend triggers paywall (e.g. "pop" keyword) */
  popTrigger?: boolean;
};

export type ChatApproveBody = { sessionId: SessionId };
export type ChatApproveResponse = {
  ok: boolean;
  signInSuggested?: boolean;
  buildId?: BuildId;
};

export type SignUpBody = { sessionId: SessionId; name: string; email: string; password: string };
export type SignUpResponse = { ok: boolean; userId?: UserId; error?: string };

export type BuildStartBody = { sessionId: SessionId; userId?: UserId };
export type BuildStartResponse = { buildId: BuildId; status: BuildStatus };

export type EditorSendBody = { buildId: BuildId; sessionId: SessionId; text: string };
export type EditorSendResponse = {
  messages: ChatMessage[];
  build?: { artifact?: BuildArtifact; status: BuildStatus };
  limitReached?: boolean;
  popTrigger?: boolean;
};

export type EditorUsageResponse = { tokenCostCents: number; limitReached: boolean; capCents: number };

export type ExportBody = { buildId: BuildId; sessionId: SessionId; userId?: UserId };
export type ExportResponse = {
  ok: boolean;
  requiresSignUp?: boolean;
  requiresPayment?: boolean;
  cardId?: CardId;
  shareUrl?: string;
  passphrase?: string;
  error?: string;
};

export type CardClaimBody = { token: string; passphrase?: string; userId?: UserId; email?: string; password?: string };
export type CardClaimResponse = {
  ok: boolean;
  cardId?: CardId;
  activatedAt?: number;
  requiresSignUp?: boolean;
  /** Card UI code for preview (returned after successful claim) */
  code?: string;
  error?: string;
};
