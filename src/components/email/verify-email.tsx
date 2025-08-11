import * as React from "react";
import {
  Html,
  Button,
  Head,
  Container,
  Heading,
  Hr,
  Preview,
  Text,
  Body,
  Section,
  Link,
} from "@react-email/components";
import { COLORS } from "@/constants/colors";
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
}

export function VerifyEmail(props: { url: string; session: User }) {
  const { url, session } = props;

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Verify your email address to complete your Fenterion Archive account
        setup
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={title}>Fenterion Archive</Heading>
          </Section>

          <Section style={content}>
            <Heading style={heading}>Welcome, {session.name}!</Heading>
            <Text style={text}>
              Thank you for joining Fenterion Archive. To complete your account
              setup and start exploring our digital library, please verify your
              email address.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={url}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={smallText}>
              If the button above doesn&apos;t work, you can copy and paste this
              link into your browser:
            </Text>
            <Link href={url} style={link}>
              {url}
            </Link>

            <Hr style={hr} />

            <Text style={footer}>
              This verification link will expire in 24 hours. If you didn&apos;t
              create this account, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: COLORS.light.muted,
  fontFamily:
    "'JetBrains Mono', 'Fira Code', 'Courier New', Consolas, Monaco, monospace",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const header = {
  padding: "24px 0",
  textAlign: "center" as const,
};

const title = {
  color: COLORS.light.primary,
  fontSize: "28px",
  fontWeight: "700",
  margin: "0",
  letterSpacing: "-0.5px",
};

const content = {
  backgroundColor: COLORS.light.card,
  padding: "32px",
  borderRadius: "16px",
  border: `1px solid ${COLORS.light.border}`,
};

const heading = {
  color: COLORS.light.foreground,
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 24px 0",
  lineHeight: "1.3",
};

const text = {
  color: COLORS.light.foreground,
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
};

const smallText = {
  color: COLORS.light.secondaryForeground,
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "24px 0 8px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: COLORS.light.primary,
  color: COLORS.light.primaryForeground,
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  borderRadius: "16px",
  border: "none",
};

const link = {
  color: COLORS.light.primary,
  fontSize: "14px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: COLORS.light.border,
  margin: "32px 0",
};

const footer = {
  color: COLORS.light.mutedForeground,
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};
