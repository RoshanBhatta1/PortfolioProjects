export default function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
