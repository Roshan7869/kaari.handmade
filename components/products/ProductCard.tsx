'use client';
import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, Star } from 'lucide-react';
import { Link } from 'next/navigation';
import type { Product } from '@/data/products';

const STAR_INDICES = [0, 1, 2, 3, 4];

interface GridProduct {
  id?: string;
  title: string;
  slug: string;
  price: number;
  image: string;
  category: string;
  allowCustomization?: boolean;
}

interface ProductCardProps {
  product: Product | GridProduct;
  index?: number;
}

function isGridProduct(product: Product | GridProduct): product is GridProduct {
  return 'title' in product && 'image' in product && !('name' in product);
}

function buildShareUrl(slug: string) {
  // Always called from a click handler — window is always defined here
  const origin = window.location.origin;
  return `${origin}/products/${slug}`;
}

async function shareProduct(name: string, price: number, slug: string, e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  const url = buildShareUrl(slug);
  const shareText = `Check out ${name} — ₹${price.toLocaleString('en-IN')} on Kaari Handmade!`;
  if (navigator.share) {
    try {
      await navigator.share({ title: name, text: shareText, url });
    } catch {
      // User cancelled or browser denied — silently ignore
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (non-HTTPS or permission denied) — silently ignore
    }
  }
}

function ProductCard({ product, index = 0 }: ProductCardProps) {
  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      const name = isGridProduct(product) ? product.title : (product as Product).name;
      shareProduct(name, product.price, product.slug, e);
    },
    [product],
  );

  if (isGridProduct(product)) {
    return (
      <motion.div
        data-testid="product-card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Link
          to={`/products/${product.slug}`}
          className="group fabric-card block cursor-pointer h-full"
        >
          <div className="aspect-[3/4] overflow-hidden relative">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

            {/* Share button — top-right, visible on hover */}
            <button
              onClick={handleShare}
              aria-label="Share product"
              className="absolute top-3 right-3 z-10 flex items-center justify-center rounded-full border border-white/30 bg-black/40 p-2 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>

            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <span className="block w-full text-center py-3 bg-primary text-primary-foreground font-body text-xs tracking-[0.15em] uppercase">
                View Details
              </span>
            </div>
          </div>

          <div className="p-5 space-y-2">
            <p className="font-heritage text-accent text-xs tracking-[0.2em] uppercase">
              {product.category}
            </p>
            <h3 className="font-display text-lg text-foreground leading-tight">
              {product.title}
            </h3>

            {product.allowCustomization && (
              <p className="font-body text-xs text-accent">Customizable</p>
            )}

            <p className="font-display text-lg text-primary font-semibold">
              ₹{product.price.toLocaleString('en-IN')}
            </p>
          </div>
        </Link>
      </motion.div>
    );
  }

  const staticProduct = product as Product;
  return (
    <motion.div
      data-testid="product-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        to={`/products/${staticProduct.slug}`}
        className="group fabric-card block cursor-pointer h-full"
      >
        <div className="aspect-[3/4] overflow-hidden relative">
          <img
            src={staticProduct.images[0]}
            alt={staticProduct.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-kaari-dark/0 group-hover:bg-kaari-dark/20 transition-colors duration-500" />

          {/* Share button — top-right, visible on hover */}
          <button
            onClick={handleShare}
            aria-label="Share product"
            className="absolute top-3 right-3 z-10 flex items-center justify-center rounded-full border border-white/30 bg-black/40 p-2 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/60"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>

          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
            <span className="block w-full text-center py-3 bg-primary text-primary-foreground font-body text-xs tracking-[0.15em] uppercase border border-kaari-gold/30">
              View Details
            </span>
          </div>
        </div>

        <div className="p-5 space-y-2">
          <p className="font-heritage text-accent text-xs tracking-[0.2em] uppercase">
            {staticProduct.category}
          </p>
          <h3 className="font-display text-lg text-foreground leading-tight">
            {staticProduct.name}
          </h3>

          <div className="flex items-center gap-1.5">
            <div className="flex">
              {STAR_INDICES.map((i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(staticProduct.rating)
                      ? 'fill-accent text-accent'
                      : 'text-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-body">
              ({staticProduct.reviewCount})
            </span>
          </div>

          <p className="font-display text-lg text-primary font-semibold">
            ₹{staticProduct.price.toLocaleString('en-IN')}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export default memo(ProductCard);
