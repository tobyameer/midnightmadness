import { Instagram, Mail, Phone } from "lucide-react";
import { PiTiktokLogo } from "react-icons/pi";

export const Footer = () => {
  const socialLinks = [
    {
      icon: Instagram,
      href: "https://www.instagram.com/clearvision.cai/",
      label: "Instagram",
    },
    {
      icon: PiTiktokLogo,
      href: "https://www.tiktok.com/@clearvisioncai",
      label: "TikTok",
    },
  ];

  return (
    <footer className="bg-secondary py-12 px-4 border-t border-border/30">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="text-center md:text-left">
            <h3 className="font-display text-2xl mb-3 text-white">
              Clear <span className="text-[#a22e1f]">Vision</span>
            </h3>
            <p className="text-gray-500 text-sm">
              The ultimate nightlife experience
            </p>
          </div>

          {/* Contact */}
          <div className="text-center">
            <h4 className="font-semibold mb-4 text-white">Contact Us</h4>
            <div className="space-y-2 text-secondary-foreground/70 text-sm">
              <a
                href="mailto:info@midnightmadness.com"
                className="flex items-center text-gray-500 justify-center gap-2 hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-[#a22e1f]" />
                midnightmadnesscai@gmail.com
              </a>
              <a
                href="tel:+201069152625"
                className="flex items-center text-gray-500  justify-center gap-2 hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-[#a22e1f]" />
                +1 (20) 106 92526
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="text-center md:text-right">
            <h4 className="font-semibold mb-4 text-white">Follow Us</h4>
            <div className="flex gap-4 justify-center md:justify-end">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="p-3  rounded-full text-gray-500 bg-card hover:text-[#a22e1f] border border-border/30 hover:border-primary/50 transition-all duration-300 group"
                  >
                    <Icon className="w-5  h-5 text-secondary-foreground/70 group-hover:text-primary transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/20 text-center text-sm text-secondary-foreground/60">
          <p>&copy; 2025 A Night in Salem. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
