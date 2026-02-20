import { cn } from "@/lib/utils";

interface VikingLogoProps {
  className?: string;
  /** Size of the icon — maps to h-N w-N */
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

/**
 * Viking Market "V" logo mark — a stylized tulip/viking horn SVG.
 * Uses `currentColor` so it inherits the parent's text color.
 */
export function VikingLogo({ className, size = "md" }: VikingLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 80"
      fill="none"
      className={cn(sizeMap[size], className)}
      aria-hidden="true"
    >
      <path
        d="M16 10C16 10 14 12 16 18C18 24 24 40 28 50C30 55 31.5 60 34 64C36 67 38 70 40 70C42 70 44 67 46 64C48.5 60 50 55 52 50C56 40 62 24 64 18C66 12 64 10 64 10C62 10 58 12 54 22C50 32 46 46 44 52C42 58 41 62 40 62C39 62 38 58 36 52C34 46 30 32 26 22C22 12 18 10 16 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Full brand lockup — logo mark + "viking market" text
 */
export function VikingBrand({
  className,
  size = "md",
  showText = true,
}: VikingLogoProps & { showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <VikingLogo size={size} />
      {showText && (
        <span className="font-semibold tracking-tight lowercase">
          viking market
        </span>
      )}
    </div>
  );
}
