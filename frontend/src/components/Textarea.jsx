import { cn } from "../utils/utils";

function Textarea({ className, ...props }) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "resize-none border-input placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:bg-input-background-focus transition",
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
