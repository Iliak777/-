import { connection } from "next/server";
import { pageI18n } from "@/i18n/server";
import { SignInGate } from "@/components/sign-in-gate";
import { currentCustomer } from "@/server/customer";
import { ChatScreen } from "./chat-screen";

export default async function ChatPage({ params }: PageProps<"/[locale]/chat">) {
  await connection();
  const { dict } = await pageI18n(params);
  const customer = await currentCustomer();
  if (!customer) return <SignInGate title={dict.chat.title} intro={dict.chat.signInIntro} />;
  return <ChatScreen />;
}
