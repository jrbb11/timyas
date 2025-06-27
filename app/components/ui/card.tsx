import { cn } from "@/utils/cn";

export function Card({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border bg-white p-4 shadow", className)} {...props} />
  );
}
