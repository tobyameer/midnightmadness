import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";

interface CopiedState {
  vodafone: boolean;
  instapay: boolean;
}

export const PaymentInfo = () => {
  const [copied, setCopied] = useState<CopiedState>({
    vodafone: false,
    instapay: false,
  });

  const vodafoneNumber =
    import.meta.env.VITE_MANUAL_VF_CASH_NUMBER || "01234567890";
  const instapayHandle =
    import.meta.env.VITE_MANUAL_INSTAPAY_HANDLE || "@yourhandle";

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

  return (
    <div className="py-20 px-6 lg:py-32 lg:px-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <Check className="w-8 h-8 text-primary relative z-10" />
            </div>
          </div>
          <h2 className="font-display text-2xl lg:text-4xl text-white text-center">
            Registration <span className="text-gradient-gold">Complete</span>
          </h2>
          <p className="text-muted-foreground lg:text-lg text-sm">
            Your ticket is reserved — complete payment to receive your QR code.
          </p>
          <p className="text-xs text-muted-foreground">
            Your data is securely stored in our system.
          </p>
        </div>

        {/* Payment Options */}
        <div className="grid grid-cols-2 gap-1 max-w-xs mx-auto lg:max-w-3xl lg:gap-6 lg:grid-cols-2">
          {/* Vodafone Cash Card */}
          <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm group hover:border-primary/50 transition-all duration-300">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />

            <CardContent className="p-2 lg:p-6 space-y-6 relative z-10">
              <div className="space-y-2">
                <h3 className="font-display text-xs text-center text-primary">
                  Vodafone Cash
                </h3>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="relative bg-secondary/80 backdrop-blur-sm rounded-lg py-4 border border-border/50">
                    <p className="text-[15px] font-mono text-foreground tracking-wider text-center">
                      {vodafoneNumber}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(vodafoneNumber, "vodafone")}
                  disabled={copied.vodafone}
                  className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 transition-all duration-200 group/btn disabled:opacity-100 text-xs"
                >
                  {copied.vodafone ? (
                    <>
                      <Check className="w-4 h-4 text-primary animate-scale-in" />
                      <span className="text-primary font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-primary group-hover/btn:scale-110 transition-transform" />
                      <span className="text-primary text-[10px] font-medium">
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

            <CardContent className="p-2 lg:p-6 space-y-6 relative z-10">
              <div className="space-y-2">
                <h3 className="font-display text-center text-xs  text-primary">
                  InstaPay
                </h3>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="relative bg-secondary/80 backdrop-blur-sm rounded-lg py-4 border border-border/50">
                    <p className="text-[15px]  font-mono text-foreground tracking-wider text-center">
                      {instapayHandle}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(instapayHandle, "instapay")}
                  disabled={copied.instapay}
                  className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 transition-all duration-200 group/btn disabled:opacity-100 text-xs"
                >
                  {copied.instapay ? (
                    <>
                      <Check className="w-4 h-4 text-accent animate-scale-in" />
                      <span className="text-accent font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-primary group-hover/btn:scale-110 transition-transform" />
                      <span className="text-primary text-[10px] font-medium">
                        Copy Number
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
          <CardContent className="p-4 lg:p-8 space-y-4 text-center">
            <p className="text-foreground text-xs leading-tight">
              After payment, your QR ticket will be verified manually and
              emailed automatically. No further action is required.
            </p>
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-tight">
              If your payment is delayed more than 30 mins, contact us on
              Instagram or reply to the confirmation email.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
