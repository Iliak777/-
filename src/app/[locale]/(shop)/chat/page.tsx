import { connection } from "next/server";
import { pageI18n } from "@/i18n/server";
import { ChatWindow } from "@/components/chat-window";
import { SignInGate } from "@/components/sign-in-gate";
import { currentCustomer } from "@/server/customer";

export default async function ChatPage({ params }: PageProps<"/[locale]/chat">) {
  await connection();
  const { dict } = await pageI18n(params);
  const customer = await currentCustomer();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-semibold">{dict.chat.title}</h1>
        <p className="mt-1 text-sm text-muted">{dict.chat.intro}</p>
      </div>
      {customer ? <ChatWindow endpoint="/api/chat" me="customer" emptyText={dict.chat.empty} className="h-[calc(100dvh-17rem)]" /> : <SignInGate />}
    </div>
  );
}
