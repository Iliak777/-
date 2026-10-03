import "server-only";

/**
 * Outgoing SMS. Only a console provider exists today; a real Thai SMS gateway
 * plugs in here (see README "Next steps").
 */
export interface SmsProvider {
  send(to: string, text: string): Promise<void>;
}

const consoleProvider: SmsProvider = {
  async send(to, text) {
    console.log(`[sms:console] to=${to} text=${JSON.stringify(text)}`);
  },
};

export function smsProvider(): SmsProvider {
  const name = process.env.SMS_PROVIDER ?? "console";
  if (name === "console") return consoleProvider;
  throw new Error(`Unknown SMS_PROVIDER "${name}"`);
}
