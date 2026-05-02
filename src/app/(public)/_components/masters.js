import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import prisma from '@/lib/prisma';

export default async function MastersSection() {
  let masters = [];
  try {
    masters = await prisma.master.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, role: true, bio: true },
    });
  } catch (e) {
    console.error('MastersSection prisma fetch failed:', e);
  }

  return (
    <section className="section-padding py-20 md:py-28 border-t border-cream-200 bg-charcoal-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-charcoal-600 mb-3">Команда</p>
            <h2 className="heading-lg text-white">Мастера</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-charcoal-800">
          {masters.length > 0 ? masters.map((m) => (
            <div key={m.id} className="bg-charcoal-900 p-8 group hover:bg-charcoal-800 transition-colors flex flex-col">
              <div className="w-16 h-16 bg-charcoal-800 border border-charcoal-700 flex items-center justify-center mb-6
                              group-hover:border-charcoal-500 transition-colors">
                <span className="font-display font-semibold text-xl text-charcoal-300">
                  {m.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-1">{m.name}</h3>
              <p className="text-[10px] text-charcoal-500 uppercase tracking-wider mb-3">{m.role}</p>
              {m.bio && <p className="text-sm text-charcoal-500 leading-relaxed line-clamp-2 mb-4">{m.bio}</p>}
              <div className="mt-auto pt-5 border-t border-charcoal-800 group-hover:border-charcoal-700 transition-colors">
                <Link href={`/booking?master=${m.id}`}
                  className="flex items-center justify-between text-[11px] uppercase tracking-wider text-charcoal-500 hover:text-white transition-colors">
                  Записаться <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )) : (
            <div className="col-span-full p-12 text-center">
              <p className="text-sm text-charcoal-500">Информация о мастерах скоро появится</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
