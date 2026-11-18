import Image from "next/image";
import Link from "next/link";
import { Flower2 } from "lucide-react";
import { WishButton } from "@/components/WishButton";
import { currentPrice, formatPrice, type Product } from "@/lib/catalog";

export function ProductCard({ product: p, priority = false }: { product: Product; priority?: boolean }) {
  const price = currentPrice(p);
  const onSale = price < p.price;
  return (
    <div className="group relative">
    <Link href={`/produkti/${p.id}`} className="block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-line bg-soft">
        {p.images[0] ? (
          <Image
            src={p.images[0]}
            alt={p.name}
            fill
            sizes="(min-width: 1200px) 280px, (min-width: 768px) 30vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : (
          <Flower2 className="absolute inset-0 m-auto size-10 text-brand/30" aria-hidden />
        )}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {!p.available && <Badge className="bg-surface/95 text-ink-soft">Pārdots</Badge>}
          {p.available && onSale && <Badge className="bg-gold-bg text-gold">Svētku cena</Badge>}
        </div>
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="line-clamp-2 font-medium leading-snug group-hover:text-brand">{p.name}</h3>
        {p.available ? (
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-semibold text-brand">{formatPrice(price)}</span>
            {onSale && <s className="text-sm text-ink-soft">{formatPrice(p.price)}</s>}
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-soft">{p.category}</p>
        )}
      </div>
    </Link>
    <WishButton id={p.id} name={p.name} className="absolute top-2 right-2 !min-h-9 !min-w-9 bg-surface/95" />
    </div>
  );
}

export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
