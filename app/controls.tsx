import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  ArrowUpRight,
  Box,
  Building2,
  Cpu,
  Factory,
  Globe2,
  Layers3,
} from 'lucide-react';
export function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
}) {
  return (
    <label className="picker">
      <span>{label}</span>
      <Select
        value={value}
        onValueChange={(v) => v && onChange(v)}
        items={options.map((o) => ({ value: o.id, label: o.name }))}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
export function EntityIcon({
  kind,
  size = 18,
}: {
  kind: string;
  size?: number;
}) {
  const Icon =
    (
      {
        company: Building2,
        product: Box,
        part: Cpu,
        facility: Factory,
        region: Globe2,
        category: Layers3,
      } as Record<string, typeof Box>
    )[kind] || Layers3;
  return <Icon size={size} aria-hidden="true" />;
}
export function Status({ value }: { value: string }) {
  return (
    <span className={'status ' + value}>
      <span />
      {value === 'direct'
        ? 'Direct evidence'
        : value === 'inferred'
          ? 'Inferred'
          : value === 'outdated'
            ? 'Outdated'
            : 'Disputed'}
    </span>
  );
}
export function Empty({
  title = 'No matching records',
  text = 'Try changing the filters. Missing records do not establish that a relationship does not exist.',
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <Layers3 size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  return (
    <div role="alert" className="empty error">
      <AlertCircle />
      <h3>Unable to load this view</h3>
      <p>{error}</p>
      <button className="cc-button" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
export function SourceLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a className="source-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={16} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
