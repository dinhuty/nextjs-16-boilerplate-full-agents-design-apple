import type { InputHTMLAttributes, ReactNode } from "react";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: ReactNode;
  name: string;
  error?: string;
};

/**
 * Label-above-field form group with inline error.
 *
 * Apple HIG: label sits above the field; placeholder is helper/example
 * content (e.g. "name@example.com"), not the primary label.
 * https://developer.apple.com/design/human-interface-guidelines/text-fields
 */
export function FormField({ label, name, error, ...inputProps }: Props) {
  const fieldId = `field-${name}`;
  return (
    <div className="w-full">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} name={name} invalid={!!error} {...inputProps} />
      <ErrorMessage>{error}</ErrorMessage>
    </div>
  );
}
