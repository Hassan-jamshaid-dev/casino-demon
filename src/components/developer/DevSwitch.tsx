type DevSwitchProps = {
  testId: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  describedBy?: string;
};

export function DevSwitch({ testId, label, checked, onChange, describedBy }: DevSwitchProps) {
  return (
    <label className="dev-switch">
      <span className="dev-switch-label">{label}</span>
      <input
        type="checkbox"
        className="dev-toggle-input"
        data-testid={testId}
        checked={checked}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
