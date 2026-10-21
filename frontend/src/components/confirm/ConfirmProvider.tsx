import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { ConfirmContext, type ConfirmOptions } from "./ConfirmContext";

const buttonBase =
    "rounded-lg px-4 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]";

const confirmButtonTone = {
    default: "bg-[#14302b] text-white hover:bg-[#20453d]",
    danger: "bg-red-700 text-white hover:bg-red-800",
};

// One modal for the whole app, opened through useConfirm(). It is the native <dialog> in modal mode, so the page
// behind it is inert and Esc backs out. While it is open the page doesn't scroll, as with the phone menu.
export function ConfirmProvider({ children }: { children: ReactNode }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const titleId = useId();
    const messageId = useId();

    const confirm = useCallback((next: ConfirmOptions) => new Promise<boolean>((resolve) => {
        // A new question replaces one that was never answered.
        resolveRef.current?.(false);
        resolveRef.current = resolve;
        setOptions(next);
    }), []);

    function finish(confirmed: boolean) {
        const resolve = resolveRef.current;
        resolveRef.current = null;
        setOptions(null);
        resolve?.(confirmed);
    }

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || !options) return;

        const returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const root = document.documentElement;
        const previousOverflow = root.style.overflow;
        root.style.overflow = "hidden";

        dialog.showModal();
        // The safe choice starts focused, so pressing Enter straight away doesn't go ahead.
        cancelButtonRef.current?.focus();

        return () => {
            if (dialog.open) dialog.close();
            root.style.overflow = previousOverflow;
            returnFocusTo?.focus();
        };
    }, [options]);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            <dialog
                ref={dialogRef}
                aria-labelledby={titleId}
                aria-describedby={messageId}
                // Esc closes the dialog without going through finish(); a close we started has already finished.
                onClose={() => {
                    if (resolveRef.current && !dialogRef.current?.open) finish(false);
                }}
                // A click on the dialog element itself, not its content, is a click on the backdrop.
                onClick={(event) => {
                    if (event.target === event.currentTarget) finish(false);
                }}
                className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-[#e0e7e2] bg-white p-0 shadow-xl backdrop:bg-[#14302b]/40"
            >
                {options && (
                    <div className="p-5 sm:p-6">
                        <h2 id={titleId} className="text-lg font-semibold text-[#14302b]">
                            {options.title}
                        </h2>
                        <p id={messageId} className="mt-2 text-sm text-gray-600">
                            {options.message}
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                onClick={() => finish(false)}
                                className={`${buttonBase} border border-[#d5dfd8] bg-white text-[#243b35] hover:bg-gray-50`}
                            >
                                {options.cancelLabel ?? "Go back"}
                            </button>
                            <button
                                type="button"
                                onClick={() => finish(true)}
                                className={`${buttonBase} ${confirmButtonTone[options.tone ?? "default"]}`}
                            >
                                {options.confirmLabel}
                            </button>
                        </div>
                    </div>
                )}
            </dialog>
        </ConfirmContext.Provider>
    );
}
