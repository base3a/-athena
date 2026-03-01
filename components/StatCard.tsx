interface StatCardProps {
  value: string;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-1 px-8 py-5 rounded-lg"
      style={{
        background: "linear-gradient(135deg, #111 0%, #0d0d0d 100%)",
        border: "1px solid #1f1f1f",
      }}
    >
      <span
        className="text-gold-gradient font-bold"
        style={{ fontSize: "1.6rem", fontFamily: "'Cinzel', serif" }}
      >
        {value}
      </span>
      <span className="text-[11px] text-[#666] tracking-widest uppercase font-medium">
        {label}
      </span>
    </div>
  );
}
