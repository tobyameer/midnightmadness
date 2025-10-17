import { Sparkles, Zap, Star } from "lucide-react";

export const Lineup = () => {
  const highlights = [
    {
      icon: Sparkles,
      title: "World-Class DJs",
      description:
        "Top international artists spinning the hottest tracks all night long",
    },
    {
      icon: Zap,
      title: "Premium Sound & Lights",
      description: "State-of-the-art sound system and mesmerizing light shows",
    },
    {
      icon: Star,
      title: "VIP Experience",
      description:
        "Exclusive lounge areas with bottle service and luxury amenities",
    },
  ];

  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl text-white md:text-5xl mb-4">
            What to <span className="text-[#a22e1f]">Expect</span>
          </h2>
          <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto">
            An immersive experience that will leave you breathless
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-gold"
              >
                <div className="mb-6 inline-block p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-10 h-10 text-[#a22e1f]" />
                </div>
                <h3 className="text-2xl text-white font-bold mb-4 font-display">
                  {highlight.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {highlight.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 p-8 md:p-12 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-border/30 text-center">
          <h3 className="font-display text-3xl md:text-4xl mb-4 text-white">
            Plus Special Surprises
          </h3>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Live performances, celebrity appearances, and unforgettable moments
            throughout the night
          </p>
        </div>
      </div>
    </section>
  );
};
