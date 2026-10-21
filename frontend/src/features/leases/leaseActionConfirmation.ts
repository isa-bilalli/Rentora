import type { ConfirmOptions } from "../../components/confirm/ConfirmContext";

// The question before ending or cancelling a lease, the same on the lease page and the property's Leases tab.
export function leaseActionConfirmation(leaseId: number, action: "end" | "cancel"): ConfirmOptions {
    return action === "end"
        ? {
              title: `End lease #${leaseId}?`,
              message: "The lease will be marked as ended.",
              confirmLabel: "End lease",
              cancelLabel: "Keep lease",
              tone: "danger",
          }
        : {
              title: `Cancel lease #${leaseId}?`,
              message: "This can't be undone from this screen.",
              confirmLabel: "Cancel lease",
              cancelLabel: "Keep lease",
              tone: "danger",
          };
}
