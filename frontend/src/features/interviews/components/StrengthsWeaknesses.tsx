type StrengthsWeaknessesProps = {
  strengths: string[];
  weaknesses: string[];
  suggestions?: string[];
};

const ItemList = ({ title, color, items }: { title: string; color: string; items: string[] }) => (
  <div className="rounded-2xl border border-stroke p-5 dark:border-strokedark">
    <p className="mb-3 text-sm font-semibold" style={{ color }}>
      {title}
    </p>
    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span style={{ color }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const StrengthsWeaknesses = ({ strengths, weaknesses, suggestions = [] }: StrengthsWeaknessesProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ItemList title="Strengths" color="#22c55e" items={strengths} />
      <ItemList title="Improvements" color="#ef4444" items={weaknesses} />
      {suggestions.length > 0 && (
        <div className="md:col-span-2">
          <ItemList title="Suggestions" color="#3b82f6" items={suggestions} />
        </div>
      )}
    </div>
  );
};

export default StrengthsWeaknesses;

