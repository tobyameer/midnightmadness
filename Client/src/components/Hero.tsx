import heroImage from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden bg-[hsl(var(--background))]">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,11,12,0.92)_0%,rgba(26,19,20,0.6)_50%,rgba(13,11,12,0.95)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center">
        {/* Line 1: Clear Vision */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-[0.08em] md:tracking-[0.12em] lg:tracking-[0.16em] text-white mb-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="font-halloween">CLEAR </span>
          <span className="font-halloween text-[#a22e1f]">VISION</span>
        </h1>

        {/* Line 2: Halloween Party */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-[0.08em] md:tracking-[0.12em] lg:tracking-[0.16em] text-[#a22e1f] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="font-halloween">Halloween </span>
          <span className="font-halloween text-white">Party</span>
        </h1>

        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <a
            href="#register"
            className="inline-block text-sm uppercase tracking-[0.3em] text-muted-foreground"
          >
            ↓ Scroll to Register
          </a>
        </div>
      </div>
    </section>
  );
};
