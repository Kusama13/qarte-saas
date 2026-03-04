'use client';

export default function NoRightClick({ children }: { children: React.ReactNode }) {
  return (
    <div onContextMenu={(e) => e.preventDefault()} className="contents">
      {children}
    </div>
  );
}
