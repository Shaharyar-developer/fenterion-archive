import * as z from "zod";
import { useForm } from "react-hook-form";
import React, { useState } from "react";
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
import { Button } from "../ui/button";
import { zodResolver } from "@hookform/resolvers/zod";

export const formSchema = z.object({
  title: z
    .string()
    .min(5, "Title is required (min. 5 characters)")
    .max(100, "Title is too long (max. 100 characters)"),
});

export function CreateDraftForm(props: {
  onSubmit?: (data: z.infer<typeof formSchema>) => void;
  loading?: boolean;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  function onsSubmit(v: z.infer<typeof formSchema>) {
    props.onSubmit?.(v);
  }
  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onsSubmit)}
          className="flex flex-col w-full mx-auto rounded-md max-w-3xl gap-2"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormDescription>
                  Enter a title for the chapter (can be edited)
                </FormDescription>
                <FormControl>
                  <div className="flex items-center">
                    <Input
                      placeholder="Beginnings 101"
                      type={"text"}
                      disabled={props.loading}
                      value={field.value}
                      className="rounded-r-none"
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val);
                      }}
                    />
                    <Button
                      className="rounded-l-none"
                      variant={"outline"}
                      type="submit"
                      disabled={props.loading}
                    >
                      {props.loading ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end items-center w-full pt-3"></div>
        </form>
      </Form>
    </div>
  );
}
