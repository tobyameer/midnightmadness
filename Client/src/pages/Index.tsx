import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { RegistrationForm } from "@/components/RegistrationForm";
import { EventDetails } from "@/components/EventDetails";
import { Lineup } from "@/components/Lineup";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showBanner, setShowBanner] = useState(
    Boolean(
      (location.state as { paymentSubmitted?: boolean } | null)?.paymentSubmitted,
    ),
  );

  useEffect(() => {
    const state = location.state as { paymentSubmitted?: boolean } | null;
    if (state?.paymentSubmitted) {
      setShowBanner(true);
      toast({
        title: "Payment submitted",
        description: "We received your payment note. Please watch your inbox.",
      });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, toast]);

  return (
    <div className="min-h-screen">
      {showBanner && (
        <div className="bg-emerald-500/90 text-white">
          <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 text-sm md:text-base">
            <span className="font-medium">
              Payment submitted. Check your email.
            </span>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/60 text-white transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <Hero />
      <RegistrationForm />
      <EventDetails />
      <Lineup />
      <Footer />
    </div>
  );
};

export default Index;
