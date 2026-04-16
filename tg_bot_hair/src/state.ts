// In-memory state machine for multi-step dialogs

export type UserStep =
  | { step: 'idle' }
  | { step: 'awaiting_admin_secret' }
  | { step: 'awaiting_assign_master'; appointmentId: string };

const userStates = new Map<number, UserStep>();

export function getState(chatId: number): UserStep {
  return userStates.get(chatId) ?? { step: 'idle' };
}

export function setState(chatId: number, state: UserStep): void {
  userStates.set(chatId, state);
}

export function resetState(chatId: number): void {
  userStates.set(chatId, { step: 'idle' });
}

// Master invite tokens: token -> masterId (expire after 24h)
export interface InviteToken {
  masterId: string;
  expiresAt: number;
}
const inviteTokens = new Map<string, InviteToken>();

export function createInviteToken(masterId: string): string {
  const token = Math.random().toString(36).slice(2, 10);
  inviteTokens.set(token, {
    masterId,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });
  return token;
}

export function consumeInviteToken(token: string): string | null {
  const invite = inviteTokens.get(token);
  if (!invite) return null;
  if (invite.expiresAt < Date.now()) {
    inviteTokens.delete(token);
    return null;
  }
  inviteTokens.delete(token);
  return invite.masterId;
}
