import { Template } from '../api';

interface Props {
  templates: Template[];
  onSelect: (message: string) => void;
}

export default function TemplateSelector({ templates, onSelect }: Props) {
  if (templates.length === 0) return null;

  return (
    <div className="template-selector">
      <label className="field-label">Use template</label>
      <select
        defaultValue=""
        onChange={(e) => {
          const t = templates.find((t) => t.id === Number(e.target.value));
          if (t) {
            onSelect(t.message);
            e.target.value = '';
          }
        }}
        className="input preset-select"
      >
        <option value="" disabled>
          Select a template…
        </option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
