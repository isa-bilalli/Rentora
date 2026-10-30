import FormField from "../../../../components/ui/FormField";
import { inputClass } from "../../../../components/ui/formStyles";
import { propertyFieldLimits, type PropertyFields as PropertyFieldValues } from "../../validation";

interface PropertyFieldsProps {
    // The inputs' ids are "<idPrefix>-name", "<idPrefix>-address" and so on.
    idPrefix: string;
    values: PropertyFieldValues;
    onChange: (field: keyof PropertyFieldValues, value: string) => void;
    disabled: boolean;
    // "create" marks required fields with a star and shows example placeholders;
    // "edit" shows plain labels, the inputs already holding the property's values.
    mode: "create" | "edit";
}

const fields: {
    field: keyof PropertyFieldValues;
    id: string;
    label: string;
    required: boolean;
    fullWidth: boolean;
    placeholder: string;
}[] = [
    { field: "name", id: "name", label: "Property name", required: true, fullWidth: true, placeholder: "e.g. Riverside Apartments" },
    { field: "addressLine", id: "address", label: "Street address", required: true, fullWidth: true, placeholder: "e.g. 25 Main Street" },
    { field: "city", id: "city", label: "City", required: true, fullWidth: false, placeholder: "e.g. Prishtina" },
    { field: "postalCode", id: "postal-code", label: "Postal code", required: false, fullWidth: false, placeholder: "e.g. 10000" },
    { field: "country", id: "country", label: "Country", required: true, fullWidth: true, placeholder: "e.g. Kosovo" },
];

// A property's name and address, as the create page and the edit form both ask for them.
export default function PropertyFields({ idPrefix, values, onChange, disabled, mode }: PropertyFieldsProps) {
    const creating = mode === "create";

    return (
        <div className="grid gap-5 sm:grid-cols-2">
            {fields.map(({ field, id, label, required, fullWidth, placeholder }) => {
                const inputId = `${idPrefix}-${id}`;

                return (
                    <FormField
                        key={field}
                        htmlFor={inputId}
                        label={creating || required ? label : `${label} (optional)`}
                        hint={creating ? (required ? "required" : "optional") : undefined}
                        className={fullWidth ? "sm:col-span-2" : undefined}
                    >
                        <input
                            id={inputId}
                            required={required}
                            maxLength={propertyFieldLimits[field]}
                            value={values[field]}
                            onChange={(event) => onChange(field, event.target.value)}
                            placeholder={creating ? placeholder : undefined}
                            disabled={disabled}
                            className={inputClass}
                        />
                    </FormField>
                );
            })}
        </div>
    );
}
