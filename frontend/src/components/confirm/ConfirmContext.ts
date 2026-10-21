import { createContext } from "react";

export interface ConfirmOptions {
    title: string;
    message: string;
    // The button that goes ahead, named for the action, e.g. "Void payment".
    confirmLabel: string;
    // The button that backs out. "Go back" by default, which stays clear when the action is itself a cancel.
    cancelLabel?: string;
    // "danger" for actions that can't be undone.
    tone?: "default" | "danger";
}

// Resolves true when the person goes ahead, and false when they back out: the button, Esc or a click outside.
export type Confirm = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<Confirm | undefined>(undefined);
