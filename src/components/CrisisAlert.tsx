export default function CrisisAlert() {
  return (
    <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3">
      <span className="text-red-500 text-xl shrink-0">⚠</span>
      <div>
        <p className="font-bold text-red-800 text-sm">Crisis Content — Do Not Use for Promotion</p>
        <p className="text-red-700 text-xs mt-1">
          This content may indicate the person is in distress or danger. Only a crisis-safe
          compassionate reply is available. Do not add promotional language. If you reply,
          encourage them to reach out to a crisis line (988 in the US) or trusted person.
        </p>
      </div>
    </div>
  );
}
