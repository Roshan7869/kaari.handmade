import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface ShareDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productPrice: number;
  productImage?: string;
  productUrl: string;
}

export default function ShareDrawer({
  open,
  onOpenChange,
  productName,
  productPrice,
  productImage,
  productUrl,
}: ShareDrawerProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Check out ${productName} — ₹${productPrice.toLocaleString('en-IN')} on Kaari Handmade! ${productUrl}`;

  const channels = [
    {
      label: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      color: 'bg-[#25D366] text-white',
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    },
    {
      label: 'X / Twitter',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.633 5.904-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: 'bg-black text-white',
      href: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    },
    {
      label: 'Instagram',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      color: 'bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white',
      // Instagram doesn't offer a web share URL; opens the app on mobile via deep link
      href: `instagram://sharesheet?text=${encodeURIComponent(shareText)}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Legacy fallback for non-HTTPS or older browser contexts
      const el = document.createElement('textarea');
      el.value = productUrl;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="font-display text-xl text-center">Share this product</DrawerTitle>
        </DrawerHeader>

        {/* Product preview card */}
        <div className="mx-4 mb-4 flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-3">
          {productImage && (
            <img
              src={productImage}
              alt={productName}
              className="h-16 w-16 rounded-md object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-foreground truncate">{productName}</p>
            <p className="font-body text-sm text-primary font-bold mt-0.5">
              ₹{productPrice.toLocaleString('en-IN')}
            </p>
            <p className="font-body text-xs text-muted-foreground truncate mt-0.5">{productUrl}</p>
          </div>
        </div>

        {/* Share channels */}
        <div className="grid grid-cols-3 gap-3 px-4 pb-2">
          {channels.map((ch) => (
            <a
              key={ch.label}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-2 rounded-xl py-4 px-2 transition-opacity hover:opacity-90 ${ch.color}`}
            >
              {ch.icon}
              <span className="font-body text-xs font-medium">{ch.label}</span>
            </a>
          ))}
        </div>

        {/* Copy link */}
        <div className="px-4 pb-6 pt-3">
          <button
            onClick={handleCopy}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 font-body text-sm transition-colors hover:bg-muted"
          >
            <span className="truncate text-muted-foreground">{productUrl}</span>
            <span className="flex items-center gap-1.5 shrink-0 text-accent font-medium">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy link
                </>
              )}
            </span>
          </button>
        </div>

        <DrawerClose className="sr-only">Close</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}

interface ShareButtonProps {
  onClick: () => void;
  className?: string;
}

export function ShareButton({ onClick, className = '' }: ShareButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Share product"
      className={`flex items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm p-2 text-foreground transition-colors hover:bg-muted hover:text-accent ${className}`}
    >
      <Share2 className="h-4 w-4" />
    </button>
  );
}
