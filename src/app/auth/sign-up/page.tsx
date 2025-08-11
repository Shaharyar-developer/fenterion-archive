import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { SignUpForm } from "./form";
import { ROUTES } from "@/lib/routes";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect(ROUTES.home);
  }
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full h-full grid lg:grid-cols-2">
        <div className="max-w-sm m-auto w-full flex flex-col items-center">
          <p className="mt-4 text-xl font-bold tracking-tight">
            Sign up for the Fenterion Archive
          </p>

          <Separator className="my-2" />
          <SignUpForm />
          <p className="mt-5 text-sm text-center">
            Already have an account?
            <Link
              href={ROUTES.auth.signIn}
              className="ml-1 underline text-muted-foreground"
            >
              Log in
            </Link>
          </p>
        </div>
        <div className="bg-muted hidden lg:block" />
      </div>
    </div>
  );
}
