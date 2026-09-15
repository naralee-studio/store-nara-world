import type { Option } from "./shopify-product-adapter";

export function VariantBadges({
  option,
  value,
  onChange,
  unavailable,
}: {
  option: Option;
  value: string;
  onChange: (id: string) => void;
  unavailable: string;
}) {
  const badge = (item: Option["values"][number]) => (
    <button
      key={item.id}
      type="button"
      className="variant-badge"
      aria-pressed={item.id === value}
      aria-label={item.available ? item.name : `${item.name} — ${unavailable}`}
      onClick={() => onChange(item.id)}
    >
      {item.name}
    </button>
  );
  const standalone = option.values.filter((item) => item.standalone);
  const remaining = option.values.filter((item) => !item.standalone);
  return (
    <fieldset className="variant-options">
      <legend className="visually-hidden">{option.name}</legend>
      {standalone.length > 0 && (
        <div className="variant-standalone">{standalone.map(badge)}</div>
      )}
      <div className="variant-badges">{remaining.map(badge)}</div>
    </fieldset>
  );
}
