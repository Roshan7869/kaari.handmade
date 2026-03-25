"use client";

export default function CustomDesignForm() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-2xl mx-auto px-6">
        <h2 className="font-display text-4xl text-center text-kaari-dark mb-4">
          Custom Designs
        </h2>
        <p className="text-center text-kaari-dark/60 mb-12">
          Have a custom idea? We'd love to bring it to life for you.
        </p>
        <form className="space-y-6">
          <div>
            <label className="block font-body text-sm text-kaari-dark mb-2">
              Your Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-kaari-dark/20 rounded-lg focus:outline-none focus:border-kaari-dark"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-kaari-dark mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-kaari-dark/20 rounded-lg focus:outline-none focus:border-kaari-dark"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-kaari-dark mb-2">
              Describe Your Design
            </label>
            <textarea
              className="w-full px-4 py-2 border border-kaari-dark/20 rounded-lg focus:outline-none focus:border-kaari-dark h-32"
              placeholder="Tell us about your custom design idea..."
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-kaari-dark text-kaari-cream font-body text-sm uppercase tracking-widest hover:bg-kaari-dark/90 transition-colors rounded-lg"
          >
            Request Quote
          </button>
        </form>
      </div>
    </section>
  );
}
