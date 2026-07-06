import { Toast } from "@base-ui/react/toast";
import {
	CheckCircleIcon,
	InfoIcon,
	WarningCircleIcon,
	XCircleIcon,
	XIcon,
} from "@phosphor-icons/react/ssr";
import { cva } from "./cva.config";

type ToastType = "success" | "error" | "warning" | "info";

export const toastManager = Toast.createToastManager();

function addToast(
	type: ToastType,
	description: React.ReactNode,
	title?: React.ReactNode,
) {
	return toastManager.add({ type, title, description });
}

export const toast = {
	success: (description: React.ReactNode, title?: React.ReactNode) =>
		addToast("success", description, title),
	error: (description: React.ReactNode, title?: React.ReactNode) =>
		addToast("error", description, title),
	warning: (description: React.ReactNode, title?: React.ReactNode) =>
		addToast("warning", description, title),
	info: (description: React.ReactNode, title?: React.ReactNode) =>
		addToast("info", description, title),
	dismiss: (id?: string) => toastManager.close(id),
};

const icons: Record<ToastType, React.ReactNode> = {
	success: <CheckCircleIcon size={24} weight="fill" />,
	error: <XCircleIcon size={24} weight="fill" />,
	warning: <WarningCircleIcon size={24} weight="fill" />,
	info: <InfoIcon size={24} weight="fill" />,
};

const root = cva({
	base: [
		"relative flex w-80 items-start gap-3 rounded-lg border border-dark-grey/10 bg-white p-3 text-dark-grey shadow-lg shadow-dark-grey/15",
		"transition-[transform,opacity] duration-200 ease-out",
		"data-starting-style:translate-y-1 data-starting-style:opacity-0",
		"data-ending-style:opacity-0 data-[swipe-direction]:transition-none",
		"items-center",
	],
	variants: {
		type: {
			success: "[&_.toast-icon]:text-green-600",
			error: "[&_.toast-icon]:text-redleather",
			warning: "[&_.toast-icon]:text-amber-600",
			info: "[&_.toast-icon]:text-graphite",
		},
	},
	defaultVariants: {
		type: "info",
	},
});

function ToastList() {
	const { toasts } = Toast.useToastManager();

	return toasts.map((item) => (
		<Toast.Root
			key={item.id}
			toast={item}
			className={root({ type: item.type as ToastType })}
		>
			<div className="toast-icon mt-0.5 shrink-0">
				{icons[item.type as ToastType]}
			</div>
			<div className="flex-1 space-y-0.5">
				<Toast.Title className="font-semibold text-sm" />
				<Toast.Description className="text-sm text-dark-grey" />
			</div>
			<Toast.Close
				aria-label="Dismiss"
				className="shrink-0 cursor-pointer rounded p-1 text-dark-grey outline-none hover:bg-dark-grey/5 "
			>
				<XIcon size={16} className="text-dark-grey" />
			</Toast.Close>
		</Toast.Root>
	));
}

export function Toaster({ children }: { children: React.ReactNode }) {
	return (
		<Toast.Provider toastManager={toastManager}>
			{children}
			<Toast.Portal>
				<Toast.Viewport className="fixed right-4 bottom-4 z-50 flex flex-col gap-2 outline-none">
					<ToastList />
				</Toast.Viewport>
			</Toast.Portal>
		</Toast.Provider>
	);
}
