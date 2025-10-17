import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";

interface CopiedState {
  vodafone: boolean;
  instapay: boolean;
}

type PackageType = "single" | "couple";

const PRICES: Record<PackageType, number> = {
  single: 750,
  couple: 1300,
};

export const PaymentInfo = () => {
  const [copied, setCopied] = useState<CopiedState>({
    vodafone: false,
    instapay: false,
  });

  // Try to infer the selected package (fallback to single)
  const packageType: PackageType = useMemo(() => {
    try {
      const urlPkg = new URLSearchParams(window.location.search).get("pkg");
      const stored =
        localStorage.getItem("mm_packageType") ||
        sessionStorage.getItem("mm_packageType") ||
        "";
      const value = (urlPkg || stored || "single").toLowerCase();
      return value === "couple" ? "couple" : "single";
    } catch {
      return "single";
    }
  }, []);

  const amountDue = PRICES[packageType];

  const vodafoneNumber =
    import.meta.env.VITE_MANUAL_VF_CASH_NUMBER || "01113391995";
  const instapayHandle =
    import.meta.env.VITE_MANUAL_INSTAPAY_HANDLE || "01112818338";

  const handleCopy = async (text: string, type: keyof CopiedState) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Avoid CLS: ensure we scroll to top on first load so everything fits "one screen" on phones
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <div className="py-10 px-4 sm:py-14 lg:py-24 lg:px-12">
      <div className="max-w-[720px] mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="inline-block">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/20 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <Check className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary relative z-10" />
            </div>
          </div>

          <h2 className="font-display text-xl sm:text-2xl lg:text-4xl text-white text-center leading-tight">
            Registration <span className="text-gradient-gold">Complete</span>
          </h2>

          <p className="text-muted-foreground text-[12px] sm:text-sm lg:text-lg">
            Your ticket is reserved — complete payment to receive your QR code.
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            Your data is securely stored in our system.
          </p>

          {/* Amount Due badge */}
          <div className="pt-2 sm:pt-3">
            <div className="inline-flex items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 lg:px-6 lg:py-3">
              <span className="text-orange-400 font-semibold text-sm sm:text-base lg:text-lg tracking-wide">
                Amount Due: {amountDue.toLocaleString()} EGP
              </span>
            </div>
            <div className="mt-1">
              <span className="text-[11px] sm:text-xs text-muted-foreground">
                Based on the <span className="capitalize">{packageType}</span>{" "}
                package
              </span>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Etisalat Cash Card */}
          <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/50 transition-all duration-300">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <CardContent className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 relative z-10">
              <div className="space-y-1 sm:space-y-2">
                <h3 className="font-display text-[11px] sm:text-xs text-center text-primary">
                  Etisalat Cash
                </h3>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="relative bg-secondary/80 backdrop-blur-sm rounded-lg py-3 sm:py-4 border border-border/50">
                    <p className="text-sm sm:text-base lg:text-lg font-mono text-foreground tracking-wider text-center">
                      {vodafoneNumber}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(vodafoneNumber, "vodafone")}
                  disabled={copied.vodafone}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 transition-all duration-200 group/btn disabled:opacity-100 text-[11px] sm:text-xs"
                >
                  {copied.vodafone ? (
                    <>
                      <Check className="w-4 h-4 text-primary animate-scale-in" />
                      <span className="text-primary font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-primary group-hover/btn:scale-110 transition-transform" />
                      <span className="text-primary font-medium">
                        Copy Number
                      </span>
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* InstaPay Card */}
          <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm group hover:border-accent/50 transition-all duration-300">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse" />
            <CardContent className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 relative z-10">
              <div className="space-y-1 sm:space-y-2">
                <h3 className="font-display text-center text-[11px] sm:text-xs text-primary">
                  InstaPay
                </h3>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="relative bg-secondary/80 backdrop-blur-sm rounded-lg py-3 sm:py-4 border border-border/50">
                    <p className="text-sm sm:text-base lg:text-lg font-mono text-foreground tracking-wider text-center">
                      {instapayHandle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(instapayHandle, "instapay")}
                  disabled={copied.instapay}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 transition-all duration-200 group/btn disabled:opacity-100 text-[11px] sm:text-xs"
                >
                  {copied.instapay ? (
                    <>
                      <Check className="w-4 h-4 text-accent animate-scale-in" />
                      <span className="text-accent font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-primary group-hover/btn:scale-110 transition-transform" />
                      <span className="text-primary font-medium">
                        Copy Handle
                      </span>
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="border-border/30 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 lg:p-8 space-y-3 sm:space-y-4 text-center">
            <p className="text-foreground text-[12px] sm:text-xs lg:text-sm leading-tight">
              After payment, your QR ticket will be verified manually and
              emailed automatically. No further action is required.
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground max-w-2xl mx-auto leading-tight">
              If your payment is delayed more than 30 mins, contact us on
              Instagram or reply to the confirmation email.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
