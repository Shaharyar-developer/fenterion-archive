import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { username } from "better-auth/plugins";
import { env } from "./env";
import Plunk from "@plunk/node";
import { VerifyEmail } from "@/components/email/verify-email";
import { render } from "@react-email/components";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    async sendVerificationEmail({ url, user }) {
      const plunk = new Plunk(env.PLUNK_API_KEY);
      const emailContent = await render(
        <VerifyEmail url={url} session={user} />
      );
      plunk.emails.send({
        to: user.email,
        subject: "Verify your email",
        body: emailContent,
      });
    },
    autoSignInAfterVerification: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [username()],
});

export type Session = typeof auth.$Infer.Session;
