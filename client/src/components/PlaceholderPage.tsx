import { Card } from '@/components/ui/Card';

export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
      <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
        <p className="text-slate-500">This module is coming up in {phase}.</p>
        <p className="text-sm text-slate-400">The foundation and navigation are ready.</p>
      </Card>
    </div>
  );
}
