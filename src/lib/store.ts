/**
 * Store for sessions, users, builds, cards. Uses Supabase when configured;
 * falls back to in-memory Maps when SUPABASE_SERVICE_ROLE_KEY is not set (e.g. dev).
 * All methods are async; API routes must await.
 */

import { supabaseServer } from "./supabase-server";
import type {
  Session,
  SessionId,
  User,
  UserId,
  Build,
  BuildId,
  Card,
  CardId,
  CreativeSummary,
  Blueprint,
  BuildArtifact,
} from "./types";
import type { Database } from "./database.types";

const sessions = new Map<SessionId, Session>();
const users = new Map<UserId, User>();
const builds = new Map<BuildId, Build>();
const cardsByToken = new Map<string, Card>();
const cardsById = new Map<CardId, Card>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function sessionToRow(s: Session): Database["public"]["Tables"]["sessions"]["Insert"] {
  return {
    id: s.id,
    device_id: s.deviceId,
    user_id: s.userId ?? null,
    created_at: s.createdAt,
    phase: s.phase,
    collector_user_message_count: s.collectorUserMessageCount ?? null,
    collector_messages: s.collectorMessages as Database["public"]["Tables"]["sessions"]["Row"]["collector_messages"],
    creative_summary: s.creativeSummary as Database["public"]["Tables"]["sessions"]["Row"]["creative_summary"],
    approved_at: s.approvedAt ?? null,
    build_id: s.buildId ?? null,
  };
}

function rowToSession(r: Database["public"]["Tables"]["sessions"]["Row"]): Session {
  return {
    id: r.id,
    deviceId: r.device_id,
    userId: r.user_id ?? undefined,
    createdAt: r.created_at,
    phase: r.phase as Session["phase"],
    collectorUserMessageCount: r.collector_user_message_count ?? undefined,
    collectorMessages: r.collector_messages as Session["collectorMessages"],
    creativeSummary: r.creative_summary as Session["creativeSummary"],
    approvedAt: r.approved_at ?? undefined,
    buildId: r.build_id ?? undefined,
  };
}

function userToRow(u: User): Database["public"]["Tables"]["users"]["Insert"] {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    password_hash: u.passwordHash,
    created_at: u.createdAt,
  };
}

function rowToUser(r: Database["public"]["Tables"]["users"]["Row"]): User {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
  };
}

function buildToRow(b: Build): Database["public"]["Tables"]["builds"]["Insert"] {
  return {
    id: b.id,
    session_id: b.sessionId,
    user_id: b.userId ?? null,
    status: b.status,
    creative_summary: b.creativeSummary as Database["public"]["Tables"]["builds"]["Row"]["creative_summary"],
    blueprint: b.blueprint as Database["public"]["Tables"]["builds"]["Row"]["blueprint"],
    artifact: b.artifact as Database["public"]["Tables"]["builds"]["Row"]["artifact"],
    token_cost_cents: b.tokenCostCents,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
    error: b.error ?? null,
  };
}

function rowToBuild(r: Database["public"]["Tables"]["builds"]["Row"]): Build {
  return {
    id: r.id,
    sessionId: r.session_id,
    userId: r.user_id ?? undefined,
    status: r.status as Build["status"],
    creativeSummary: r.creative_summary as CreativeSummary,
    blueprint: r.blueprint as Build["blueprint"],
    artifact: r.artifact as Build["artifact"],
    tokenCostCents: r.token_cost_cents,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    error: r.error ?? undefined,
  };
}

function cardToRow(c: Card): Database["public"]["Tables"]["cards"]["Insert"] {
  return {
    id: c.id,
    build_id: c.buildId,
    owner_id: c.ownerId,
    status: c.status,
    share_token: c.shareToken,
    passphrase: c.passphrase ?? null,
    activated_at: c.activatedAt ?? null,
    claimed_by_user_id: c.claimedByUserId ?? null,
    created_at: c.createdAt,
    exported_at: c.exportedAt ?? null,
    code: c.code ?? "",
  };
}

function rowToCard(r: Database["public"]["Tables"]["cards"]["Row"]): Card {
  return {
    id: r.id,
    buildId: r.build_id,
    ownerId: r.owner_id,
    status: r.status as Card["status"],
    shareToken: r.share_token,
    passphrase: r.passphrase ?? undefined,
    activatedAt: r.activated_at ?? undefined,
    claimedByUserId: r.claimed_by_user_id ?? undefined,
    createdAt: r.created_at,
    exportedAt: r.exported_at ?? undefined,
    code: r.code,
  };
}

export const store = {
  async getSession(sessionId: SessionId): Promise<Session | undefined> {
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (error || !data) return undefined;
      const session = rowToSession(data);
      sessions.set(sessionId, session);
      return session;
    }
    return sessions.get(sessionId);
  },

  async createSession(deviceId: string, userId?: UserId): Promise<Session> {
    const id = generateId("sess");
    const session: Session = {
      id,
      deviceId,
      userId,
      createdAt: Date.now(),
      phase: "collector",
    };
    if (supabaseServer) {
      const { error } = await supabaseServer.from("sessions").insert(sessionToRow(session));
      if (error) throw new Error(`Failed to create session: ${error.message}`);
    }
    sessions.set(id, session);
    return session;
  },

  async updateSession(sessionId: SessionId, patch: Partial<Session>): Promise<Session | undefined> {
    const s = await store.getSession(sessionId);
    if (!s) return undefined;
    const updated: Session = { ...s, ...patch };
    if (supabaseServer) {
      const row = sessionToRow(updated);
      const { error } = await supabaseServer.from("sessions").update(row).eq("id", sessionId);
      if (error) throw new Error(`Failed to update session: ${error.message}`);
    }
    sessions.set(sessionId, updated);
    return updated;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from("users")
        .select("*")
        .ilike("email", email)
        .maybeSingle();
      if (error || !data) return undefined;
      const user = rowToUser(data);
      users.set(user.id, user);
      return user;
    }
    return [...users.values()].find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  async getUser(userId: UserId): Promise<User | undefined> {
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("users").select("*").eq("id", userId).single();
      if (error || !data) return undefined;
      const user = rowToUser(data);
      users.set(userId, user);
      return user;
    }
    return users.get(userId);
  },

  async createUser(email: string, name: string, passwordHash: string): Promise<User> {
    const id = generateId("user");
    const user: User = { id, email, name, passwordHash, createdAt: Date.now() };
    if (supabaseServer) {
      const { error } = await supabaseServer.from("users").insert(userToRow(user));
      if (error) throw new Error(`Failed to create user: ${error.message}`);
    }
    users.set(id, user);
    return user;
  },

  async getBuild(buildId: BuildId): Promise<Build | undefined> {
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("builds").select("*").eq("id", buildId).single();
      if (error || !data) return undefined;
      const build = rowToBuild(data);
      builds.set(buildId, build);
      return build;
    }
    return builds.get(buildId);
  },

  async createBuild(sessionId: SessionId, creativeSummary: CreativeSummary, userId?: UserId): Promise<Build> {
    const id = generateId("build");
    const build: Build = {
      id,
      sessionId,
      userId,
      status: "pending",
      creativeSummary,
      tokenCostCents: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (supabaseServer) {
      const { error } = await supabaseServer.from("builds").insert(buildToRow(build));
      if (error) throw new Error(`Failed to create build: ${error.message}`);
    }
    builds.set(id, build);
    return build;
  },

  async updateBuild(buildId: BuildId, patch: Partial<Build>): Promise<Build | undefined> {
    const b = await store.getBuild(buildId);
    if (!b) return undefined;
    const updated: Build = { ...b, ...patch, updatedAt: Date.now() };
    if (supabaseServer) {
      const row = buildToRow(updated);
      const { error } = await supabaseServer.from("builds").update(row).eq("id", buildId);
      if (error) throw new Error(`Failed to update build: ${error.message}`);
    }
    builds.set(buildId, updated);
    return updated;
  },

  async getCardByToken(token: string): Promise<Card | undefined> {
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("cards").select("*").eq("share_token", token).single();
      if (error || !data) return undefined;
      const card = rowToCard(data);
      cardsById.set(card.id, card);
      cardsByToken.set(token, card);
      return card;
    }
    return cardsByToken.get(token);
  },

  async getCard(cardId: CardId): Promise<Card | undefined> {
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("cards").select("*").eq("id", cardId).single();
      if (error || !data) return undefined;
      const card = rowToCard(data);
      cardsById.set(cardId, card);
      if (card.shareToken) cardsByToken.set(card.shareToken, card);
      return card;
    }
    return cardsById.get(cardId);
  },

  async createCard(
    buildId: BuildId,
    ownerId: UserId,
    shareToken: string,
    passphrase?: string,
    code?: string
  ): Promise<Card> {
    const id = generateId("card");
    const card: Card = {
      id,
      buildId,
      ownerId,
      status: "exported",
      shareToken,
      passphrase,
      code: code ?? "",
      createdAt: Date.now(),
      exportedAt: Date.now(),
    };
    if (supabaseServer) {
      const { error } = await supabaseServer.from("cards").insert(cardToRow(card));
      if (error) throw new Error(`Failed to create card: ${error.message}`);
    }
    cardsById.set(id, card);
    cardsByToken.set(shareToken, card);
    return card;
  },

  async updateCard(cardId: CardId, patch: Partial<Card>): Promise<Card | undefined> {
    const c = await store.getCard(cardId);
    if (!c) return undefined;
    const updated = { ...c, ...patch };
    if (supabaseServer) {
      const row = cardToRow(updated);
      const { error } = await supabaseServer.from("cards").update(row).eq("id", cardId);
      if (error) throw new Error(`Failed to update card: ${error.message}`);
    }
    cardsById.set(cardId, updated);
    if (c.shareToken) cardsByToken.set(c.shareToken, updated);
    return updated;
  },

  generateShareToken(): string {
    return generateId("c").replace(/^c_/, "");
  },

  async getBuildsForUser(userId: UserId): Promise<Build[]> {
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("builds").select("*").eq("user_id", userId);
      if (error) return [];
      return (data ?? []).map(rowToBuild);
    }
    return [...builds.values()].filter((b) => b.userId === userId);
  },

  async getCardsForUser(userId: UserId): Promise<Card[]> {
    if (supabaseServer) {
      const { data, error } = await supabaseServer.from("cards").select("*").eq("owner_id", userId);
      if (error) return [];
      return (data ?? []).map(rowToCard);
    }
    return [...cardsById.values()].filter((c) => c.ownerId === userId);
  },
};
