export default function InstagramFeature() {
  return (
    <section className="py-16 md:py-24 bg-kaari-cream/30">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="font-display text-4xl text-center text-kaari-dark mb-4">
          Follow Our Journey
        </h2>
        <p className="text-center text-kaari-dark/60 mb-12">
          See our latest creations on Instagram @kaari.handmade
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square bg-kaari-cream rounded-lg flex items-center justify-center text-kaari-dark/40 hover:bg-kaari-cream/80 transition-colors cursor-pointer"
            >
              Instagram Post {i}
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <a
            href="https://www.instagram.com/kaari.handmade"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 border-2 border-kaari-dark text-kaari-dark font-body text-sm uppercase tracking-widest hover:bg-kaari-dark hover:text-kaari-cream transition-colors"
          >
            Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
