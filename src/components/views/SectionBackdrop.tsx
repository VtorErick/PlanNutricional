import type { ElementType, ReactNode } from 'react';

type SectionBackdropStat = {
  label: string;
  value: string;
};

interface SectionBackdropProps {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  accentGradientClass: string;
  icon: ElementType;
  aside?: ReactNode;
  stats?: SectionBackdropStat[];
}

export default function SectionBackdrop({
  eyebrow,
  title,
  description,
  imageSrc,
  accentGradientClass,
  icon: Icon,
  aside,
  stats = [],
}: SectionBackdropProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-[30px] shadow-[0_18px_44px_rgba(15,23,42,0.14)]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageSrc}')` }}
      />
      <div className="absolute inset-0 bg-slate-950/25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/62 to-slate-950/20" />
      <div className={`absolute inset-0 bg-gradient-to-br ${accentGradientClass} opacity-70 mix-blend-multiply`} />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/55 to-transparent" />

      <div className="relative flex min-h-[224px] flex-col justify-between gap-5 p-5 text-white sm:min-h-[248px] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/86 backdrop-blur-sm">
              <Icon className="h-3.5 w-3.5" />
              {eyebrow}
            </div>
            <h2 className="mt-3 max-w-xl text-2xl font-black tracking-tight sm:text-[2rem]">
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/82 sm:text-[15px]">
              {description}
            </p>
          </div>

          {aside ? (
            <div className="w-full sm:w-auto sm:min-w-[220px]">
              {aside}
            </div>
          ) : null}
        </div>

        {stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={`${stat.label}-${stat.value}`}
                className="rounded-[20px] border border-white/14 bg-white/12 px-3.5 py-3 backdrop-blur-md"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/62">
                  {stat.label}
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
