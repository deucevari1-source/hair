import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Услуги — Hair Atelier',
  description: 'Стрижки, окрашивание, уход — полный каталог услуг салона Hair Atelier с актуальными ценами и длительностью.',
};

// Render on each request — DB isn't reachable at build time inside Docker.
export const dynamic = 'force-dynamic';

function formatPrice(from) {
  return `${(from / 100).toLocaleString('ru-RU')} BYN`;
}

export default async function ServicesPage() {
  let categories = [];
  try {
    categories = await prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  } catch (e) {
    console.error('ServicesPage prisma fetch failed:', e);
  }

  return (
    <div className="section-padding py-10 md:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 md:mb-14">
          <span className="text-xs tracking-[0.2em] uppercase text-gold-500 font-body block mb-3">
            Каталог
          </span>
          <h1 className="heading-lg text-charcoal-900 mb-4">Наши услуги</h1>
          <p className="body-text max-w-lg">
            Полный спектр услуг для ваших волос — от классической стрижки
            до сложного окрашивания и восстанавливающего ухода.
          </p>
        </div>

        <div className="space-y-10 md:space-y-14">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center gap-3 mb-5">
                <div className="divider-gold" />
                <h2 className="font-display text-2xl font-light text-charcoal-900">
                  {cat.name}
                </h2>
              </div>

              <div className="space-y-2">
                {cat.services.map((service) => (
                  <div key={service.id}
                    className="card-luxury p-5 md:p-6 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-body font-medium text-charcoal-900 mb-1">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-sm text-charcoal-500 mb-2 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-charcoal-400">
                        <Clock size={12} />
                        <span>{service.durationMin} мин</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-lg text-charcoal-900">
                        {formatPrice(service.priceFrom)}
                      </div>
                      <Link href="/booking"
                        className="inline-flex items-center gap-1 text-xs text-gold-600 mt-2
                                   hover:text-gold-700 transition-colors">
                        Записаться <ArrowRight size={10} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-sm text-charcoal-500 mb-4">
            Не нашли нужную услугу? Свяжитесь с нами!
          </p>
          <Link href="/booking" className="btn-primary">
            Записаться <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
