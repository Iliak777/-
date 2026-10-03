import "server-only";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatThreads, customers } from "@/db/schema";

export const MAX_MESSAGE_LENGTH = 2000;

export type ChatMessage = { id: number; sender: "customer" | "staff"; body: string; createdAt: Date };

/** Messages in a customer's conversation, optionally only those after `afterId`. */
export async function listMessages(customerId: string, afterId = 0): Promise<ChatMessage[]> {
  return db
    .select({ id: chatMessages.id, sender: chatMessages.sender, body: chatMessages.body, createdAt: chatMessages.createdAt })
    .from(chatMessages)
    .where(and(eq(chatMessages.customerId, customerId), gt(chatMessages.id, afterId)))
    .orderBy(asc(chatMessages.id))
    .limit(200);
}

export async function sendMessage(customerId: string, sender: "customer" | "staff", body: string): Promise<ChatMessage | null> {
  const text = body.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!text) return null;
  const now = new Date();
  await db
    .insert(chatThreads)
    .values({ customerId, lastMessageAt: now })
    .onConflictDoUpdate({ target: chatThreads.customerId, set: { lastMessageAt: now } });
  const [msg] = await db
    .insert(chatMessages)
    .values({ customerId, sender, body: text, createdAt: now })
    .returning({ id: chatMessages.id, sender: chatMessages.sender, body: chatMessages.body, createdAt: chatMessages.createdAt });
  await markRead(customerId, sender);
  return msg;
}

export async function markRead(customerId: string, reader: "customer" | "staff") {
  const now = new Date();
  await db
    .update(chatThreads)
    .set(reader === "customer" ? { customerReadAt: now } : { staffReadAt: now })
    .where(eq(chatThreads.customerId, customerId));
}

/** Conversations for the clinic inbox, most recent first, with an unread flag. */
export async function listThreads() {
  return db
    .select({
      customerId: chatThreads.customerId,
      customerName: customers.name,
      phone: customers.phone,
      lastMessageAt: chatThreads.lastMessageAt,
      unread: sql<boolean>`exists (
        select 1 from ${chatMessages}
        where ${chatMessages.customerId} = ${chatThreads.customerId}
          and ${chatMessages.sender} = 'customer'
          and ${chatMessages.createdAt} > coalesce(${chatThreads.staffReadAt}, 'epoch'::timestamptz)
      )`,
    })
    .from(chatThreads)
    .innerJoin(customers, eq(customers.id, chatThreads.customerId))
    .orderBy(desc(chatThreads.lastMessageAt))
    .limit(100);
}

export async function unreadThreadCount(): Promise<number> {
  const rows = await listThreads();
  return rows.filter((r) => r.unread).length;
}
