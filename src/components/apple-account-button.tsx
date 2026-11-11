import { Button } from "./ui";
export function AppleAccountButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      label={label}
      disabled={disabled}
      onPress={onPress}
      variant="secondary"
    />
  );
}
