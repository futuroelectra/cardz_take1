/**
 * Backend constants per docs/MASTER_PROMPT_BACKEND.md.
 */

/** Token-cost cap new user (~$0.50). Stored as cents. */
export const TOKEN_CAP_CENTS_NEW_USER = 50;

/** Token-cost cap super user (~$1.50). Stored as cents. */
export const TOKEN_CAP_CENTS_SUPER_USER = 150;

/** Watcher/mediator: diff above this ratio (0–1) triggers realignment. */
export const WATCHER_DIFF_THRESHOLD = 0.6;

/** Rebuild: if variable change ratio above this, run Architect → Engineer again. */
export const REBUILD_VARIABLE_CHANGE_RATIO = 0.6;

/** Receiver: card active for 48 hours after claim. */
export const CARD_ACTIVE_HOURS = 48;

export const CARD_ACTIVE_MS = CARD_ACTIVE_HOURS * 60 * 60 * 1000;

/** Client storage keys for session/device/build persistence (sessionStorage + optional localStorage for deviceId). */
export const STORAGE_KEY_SESSION_ID = "cardz_session_id";
export const STORAGE_KEY_DEVICE_ID = "cardz_device_id";
export const STORAGE_KEY_BUILD_ID = "cardz_build_id";
export const STORAGE_KEY_SCREEN = "cardz_screen";
