import FormField from "../../../../components/ui/FormField";
import { inputClass } from "../../../../components/ui/formStyles";
import { spaceTypeLabels } from "../../spaceLabels";
import type { SpaceType } from "../../types";
import { spaceNameLimit, type SpaceFields } from "../../validation";

interface SpaceDraftFieldsProps {
    // The inputs' ids are "<idPrefix>-name", "<idPrefix>-type", "<idPrefix>-floor" and "<idPrefix>-area".
    idPrefix: string;
    values: SpaceFields;
    onChange: (field: keyof SpaceFields, value: string) => void;
    disabled: boolean;
}

// A space's name, type, floor and area, as typed; checkSpaceFields reads them.
export default function SpaceDraftFields({ idPrefix, values, onChange, disabled }: SpaceDraftFieldsProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <FormField htmlFor={`${idPrefix}-name`} label="Space name">
                <input
                    id={`${idPrefix}-name`}
                    required
                    maxLength={spaceNameLimit}
                    value={values.name}
                    onChange={(event) => onChange("name", event.target.value)}
                    placeholder="e.g. Apartment 1"
                    disabled={disabled}
                    className={inputClass}
                />
            </FormField>

            <FormField htmlFor={`${idPrefix}-type`} label="Space type">
                <select
                    id={`${idPrefix}-type`}
                    value={values.type}
                    onChange={(event) => onChange("type", event.target.value)}
                    disabled={disabled}
                    className={inputClass}
                >
                    {(Object.keys(spaceTypeLabels) as SpaceType[]).map((spaceType) => (
                        <option key={spaceType} value={spaceType}>
                            {spaceTypeLabels[spaceType]}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField htmlFor={`${idPrefix}-floor`} label="Floor" hint="optional">
                <input
                    id={`${idPrefix}-floor`}
                    type="number"
                    step="1"
                    value={values.floor}
                    onChange={(event) => onChange("floor", event.target.value)}
                    placeholder="e.g. 2"
                    disabled={disabled}
                    className={inputClass}
                />
            </FormField>

            <FormField htmlFor={`${idPrefix}-area`} label="Area (m²)" hint="optional">
                <input
                    id={`${idPrefix}-area`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={values.area}
                    onChange={(event) => onChange("area", event.target.value)}
                    placeholder="e.g. 75.5"
                    disabled={disabled}
                    className={inputClass}
                />
            </FormField>
        </div>
    );
}
