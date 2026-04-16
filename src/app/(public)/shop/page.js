'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="section-padding py-10 md:py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 md:mb-14">
          <span className="text-xs tracking-[0.2em] uppercase text-gold-500 font-body block mb-3">
            Бьюти-магазин
          </span>
          <h1 className="heading-lg text-charcoal-900 mb-4">Магазин</h1>
          <p className="body-text max-w-lg">
            Профессиональная косметика для волос — те же средства, 
            которые используют наши мастера в работе.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-cream-100 rounded mb-3" />
                <div className="h-4 bg-cream-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-cream-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="card-luxury group overflow-hidden">
              {/* Image placeholder */}
              <div className="aspect-square bg-gradient-to-br from-cream-100 to-cream-200 
                              flex items-center justify-center relative overflow-hidden">
                <ShoppingBag size={40} className="text-cream-400" strokeWidth={1} />
                {product.brand && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/80 backdrop-blur-sm 
                                  text-[10px] tracking-[0.1em] uppercase text-charcoal-600">
                    {product.brand}
                  </div>
                )}
              </div>

              <div className="p-4 md:p-5">
                <h3 className="font-body font-medium text-sm text-charcoal-900 mb-1 line-clamp-2">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-xs text-charcoal-500 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg text-charcoal-900">
                    {product.price.toLocaleString('ru-RU')} BYN
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <ShoppingBag size={48} className="mx-auto text-cream-300 mb-4" />
            <p className="text-charcoal-500">Товары скоро появятся</p>
          </div>
        )}
      </div>
    </div>
  );
}
