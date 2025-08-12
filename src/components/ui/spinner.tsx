import { cn } from "@/lib/utils";
import React from "react";
const Spinner = (props: { className: string }) => (
  <div
    className={cn(
      "w-7 h-7 border-[3px] border-secondary border-t-primary rounded-full animate-spin",
      props.className
    )}
  />
);
export default Spinner;
