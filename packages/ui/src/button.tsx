import { Button as BaseButton } from "@base-ui/react";
import { useId } from "react";
import { cva } from "./cva.config";

const variantRing = {
	primary: "focus-visible:ring-primary/50",
	dark: "focus-visible:ring-ink/50",
	danger: "focus-visible:ring-danger/50",
};

const variantBg = {
	primary: "bg-primary",
	dark: "bg-ink",
	danger: "bg-danger",
};

const root = cva({
	base: [
		"group relative inline-flex select-none items-center rounded-full outline-none cursor-pointer",
		"focus-visible:ring-2",
		"disabled:cursor-default disabled:opacity-40",
	],
	variants: {
		variant: variantRing,
	},
	defaultVariants: {
		variant: "primary",
	},
});

const spring =
	"transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const grow = `${spring} group-hover:scale-[1.05] group-active:scale-[1.05]`;

/**
 * Per-size layout. Small buttons put the icon on the left (mirrored from the
 * default) and travel a much shorter distance on hover so the blob split
 * stays subtle at that scale instead of the icon flying far away.
 */
const sizes = {
	md: {
		height: "h-11",
		iconBox: "size-11",
		iconSide: "right" as const,
		iconInset: "absolute inset-y-0 right-0 w-11",
		textInset: "absolute inset-y-0 left-0 right-11 origin-right",
		textOrigin: "origin-right",
		textPadding: "px-6",
		text: "font-semibold",
		slide: `${spring} group-hover:translate-x-4.75 group-active:translate-x-4.75`,
	},
	sm: {
		height: "h-8",
		iconBox: "size-8",
		iconSide: "left" as const,
		iconInset: "absolute inset-y-0 left-0 w-8",
		textInset: "absolute inset-y-0 left-8 right-0 origin-left",
		textOrigin: "origin-left",
		textPadding: "px-4",
		text: "text-sm font-semibold",
		slide: `${spring} group-hover:-translate-x-2 group-active:-translate-x-2`,
	},
};

export interface ButtonProps extends React.ComponentProps<typeof BaseButton> {
	icon?: React.ReactNode;
	variant?: "primary" | "dark" | "danger";
	size?: "md" | "sm";
}

export function Button({
	children,
	icon,
	className,
	variant = "primary",
	size = "md",
	...props
}: ButtonProps) {
	const filterId = useId();
	const bg = variantBg[variant];
	const {
		height,
		iconBox,
		iconSide,
		iconInset,
		textInset,
		textOrigin,
		textPadding,
		text,
		slide,
	} = sizes[size];

	if (!icon) {
		return (
			<BaseButton className={root({ variant, className })} {...props}>
				<span className={`absolute inset-0 rounded-full ${bg} ${grow}`} />
				<span
					className={`relative z-10 flex ${height} items-center justify-center ${textPadding} ${text} text-canvas ${grow}`}
				>
					{children}
				</span>
			</BaseButton>
		);
	}

	const iconEl = (
		<span
			className={`flex ${iconBox} items-center justify-center text-canvas ${slide}`}
		>
			{icon}
		</span>
	);
	const textEl = (
		<span
			className={`${textOrigin} ${textPadding} ${text} text-canvas ${grow}`}
		>
			{children}
		</span>
	);

	return (
		<BaseButton className={root({ variant, className })} {...props}>
			<svg aria-hidden role="presentation" className="absolute size-0">
				<filter id={filterId}>
					<feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
					<feColorMatrix
						in="blur"
						values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
						result="goo"
					/>
					<feComposite in="SourceGraphic" in2="goo" operator="atop" />
				</filter>
			</svg>
			<span
				className="absolute inset-0 flex"
				style={{ filter: `url(#${filterId})` }}
			>
				{iconSide === "left" && (
					<span className={`${iconInset} rounded-full ${bg} ${slide}`} />
				)}
				<span className={`${textInset} rounded-full ${bg} ${grow}`} />
				{iconSide === "right" && (
					<span className={`${iconInset} rounded-full ${bg} ${slide}`} />
				)}
			</span>
			<span className={`relative z-10 flex ${height} items-center`}>
				{iconSide === "left" ? (
					<>
						{iconEl}
						{textEl}
					</>
				) : (
					<>
						{textEl}
						{iconEl}
					</>
				)}
			</span>
		</BaseButton>
	);
}
