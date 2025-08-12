"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { authorQuery, userQuery } from "@/lib/queries";
import { client } from "@/lib/orpc.client";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Minimal schema (removed server action logic per request)
const formSchema = z.object({
  name: z.string().min(2, "Pen name is required"),
  bio: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AuthorApplicationDialog() {
  const router = useRouter();
  const user = userQuery();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", bio: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!user.data?.id) return router.push(ROUTES.auth.signIn);
    await client.author
      .create({
        penName: values.name,
        bio: values.bio || "",
        userId: user.data.id,
      })
      .catch(() =>
        toast.error("Failed to create author profile. Please try again later.")
      );
    router.push(ROUTES.home);
  }

  return (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
        <button className="sr-only" aria-hidden />
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <Form {...form}>
          <form
            id="author-application-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 pt-2"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Author Application</AlertDialogTitle>
              <AlertDialogDescription>
                Provide a pen name and (optional) short bio to continue.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Pen Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jormungandr"
                      type="text"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Your pen name that will be used across works.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Bio..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Link href={ROUTES.home}>Cancel</Link>
              </AlertDialogCancel>
              <Button type="submit" form="author-application-form">
                Continue
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AuthorApplicationDialog;
