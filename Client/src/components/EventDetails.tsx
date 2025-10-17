import { Calendar, MapPin, Clock, Music } from "lucide-react";

export const EventDetails = () => {
  const details = [
    {
      icon: Calendar,
      label: "Date",
      value: "October 30th, 2025",
    },
    {
      icon: Clock,
      label: "Time",
      value: "8:00 PM - 2:00 AM",
    },
    {
      icon: MapPin,
      label: "Location",
      value: "Obour City",
    },
    {
      icon: Music,
      label: "Dress Code",
      value: "Halloween costume",
    },
  ];

  return (
    <section className="py-24 px-4 bg-secondary">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl mb-4 text-white">
            Event <span className="text-[#a22e1f]">Details</span>
          </h2>
          <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto">
            Mark your calendars for an unforgettable night
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {details.map((detail, index) => {
            const Icon = detail.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/30 hover:border-primary/50 transition-all duration-300 hover:shadow-gold"
              >
                <div className="p-4 rounded-full bg-primary/10">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white uppercase tracking-wider mb-2">
                    {detail.label}
                  </p>
                  <p className="text-lg font-semibold  text-gray-500">
                    {detail.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
