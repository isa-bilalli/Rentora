import type { ReactNode } from "react";

import { labelClass } from "./formStyles";

interface FormFieldProps {
    // The id of the input or select inside, which the label names.
    htmlFor: string;
    label: string;
    // "required" puts a red star after the label, "optional" a grey "(optional)".
    hint?: "required" | "optional";
    className?: string;
    // The input or select, styled with inputClass.
    children: ReactNode;
}

// A label above one input or select.
export default function FormField({ htmlFor, label, hint, className, children }: FormFieldProps) {
    return (
        <div className={className}>
            <label htmlFor={htmlFor} className={labelClass}>
                {label}
                {hint === "required" && <span className="ml-1 text-red-600">*</span>}
                {hint === "optional" && (
                    <>
                        {" "}
                        <span className="font-normal text-gray-400">(optional)</span>
                    </>
                )}
            </label>
            {children}
        </div>
    );
}
