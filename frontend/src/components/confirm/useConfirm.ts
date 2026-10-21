import { useContext } from "react";

import { ConfirmContext } from "./ConfirmContext";

// The app's replacement for window.confirm: `if (!(await confirm({ ... }))) return;`
export function useConfirm() {
    const confirm = useContext(ConfirmContext);
    if (!confirm) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return confirm;
}
