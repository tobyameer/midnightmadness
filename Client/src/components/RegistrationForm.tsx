import { useMemo, useState, useRef, useLayoutEffect, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Users, ArrowLeft } from "lucide-react";
import { PaymentInfo } from "./PaymentInfo";
import { getEgyptianIdGender } from "@/shared/egyptId";
import { submitManualPaymentTicket } from "@/lib/api";

const singleSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  phone: z
    .string()
    .trim()
    .min(10, { message: "Please enter a valid phone number" })
    .max(15, { message: "Phone number is too long" })
    .regex(/^\+?[\d\s-()]+$/, { message: "Please enter a valid phone number" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{14}$/, {
      message: "National ID must be 14 digits",
    }),
});

const coupleSchema = z.object({
  fullName1: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  phone1: z
    .string()
    .trim()
    .min(10, { message: "Please enter a valid phone number" })
    .max(15, { message: "Phone number is too long" })
    .regex(/^\+?[\d\s-()]+$/, { message: "Please enter a valid phone number" }),
  email1: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  fullName2: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  phone2: z
    .string()
    .trim()
    .min(10, { message: "Please enter a valid phone number" })
    .max(15, { message: "Phone number is too long" })
    .regex(/^\+?[\d\s-()]+$/, { message: "Please enter a valid phone number" }),
  email2: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  nationalId1: z
    .string()
    .trim()
    .regex(/^\d{14}$/, {
      message: "National ID must be 14 digits",
    }),
  nationalId2: z
    .string()
    .trim()
    .regex(/^\d{14}$/, {
      message: "National ID must be 14 digits",
    }),
});

type SingleFormData = z.infer<typeof singleSchema>;
type CoupleFormData = z.infer<typeof coupleSchema>;
type PackageType = "single" | "couple" | null;

export const RegistrationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const { toast } = useToast();

  // --- Scroll preservation ---
  const prevScrollY = useRef<number | null>(null);
  const paymentRootRef = useRef<HTMLDivElement | null>(null);

  // Restore scroll for a few frames to defeat layout/focus jumps
  useLayoutEffect(() => {
    if (showPaymentInfo && prevScrollY.current !== null) {
      const target = prevScrollY.current;
      let frame = 0;
      const restore = () => {
        window.scrollTo(0, target);
        frame += 1;
        if (frame < 4) requestAnimationFrame(restore);
        else prevScrollY.current = null;
      };
      requestAnimationFrame(restore);
    }
  }, [showPaymentInfo]);

  // Focus the new content WITHOUT scrolling
  useEffect(() => {
    if (showPaymentInfo && paymentRootRef.current) {
      paymentRootRef.current.setAttribute("tabindex", "-1");
      // preventScroll avoids the browser snapping to top when focusing
      paymentRootRef.current.focus({ preventScroll: true } as any);
    }
  }, [showPaymentInfo]);

  const singleForm = useForm<SingleFormData>({
    resolver: zodResolver(singleSchema),
  });

  const coupleForm = useForm<CoupleFormData>({
    resolver: zodResolver(coupleSchema),
  });

  const amountDue = useMemo(() => {
    if (selectedPackage === "single") return 750;
    if (selectedPackage === "couple") return 1300;
    return null;
  }, [selectedPackage]);

  const detectGenderInfo = (value: string | undefined) => {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      return { gender: null, error: null };
    }
    const gender = getEgyptianIdGender(trimmed);
    if (gender === "invalid") {
      return { gender: null, error: "Invalid national ID. Must be 14 digits." };
    }
    return { gender, error: null };
  };

  const singleNationalId = singleForm.watch("nationalId");
  const maleNationalId = coupleForm.watch("nationalId1");
  const femaleNationalId = coupleForm.watch("nationalId2");

  const singleGenderInfo = useMemo(
    () => detectGenderInfo(singleNationalId),
    [singleNationalId]
  );
  const maleGenderInfo = useMemo(
    () => detectGenderInfo(maleNationalId),
    [maleNationalId]
  );
  const femaleGenderInfo = useMemo(
    () => detectGenderInfo(femaleNationalId),
    [femaleNationalId]
  );

  const onSubmitSingle = async (data: SingleFormData) => {
    setIsSubmitting(true);

    const payload = {
      packageType: "single" as const,
      contactEmail: data.email.trim(),
      attendees: [
        {
          fullName: data.fullName.trim(),
          nationalId: data.nationalId.trim(),
          gender:
            getEgyptianIdGender(data.nationalId.trim()) === "male"
              ? "male"
              : "female",
          email: data.email.trim(),
          phone: data.phone.trim(),
        },
      ],
    };

    try {
      // Store package type for payment info BEFORE API call
      localStorage.setItem("mm_packageType", "single");
      console.log("Stored package type: single");

      await submitManualPaymentTicket(payload);
      toast({
        title: "Registration Successful!",
        description: "Complete your payment to receive your ticket.",
        duration: 5000, // Show for 5 seconds
      });
      prevScrollY.current = window.scrollY; // capture BEFORE swap
      setShowPaymentInfo(true);
    } catch (error) {
      let errorMessage = "Unable to submit registration.";

      if (error instanceof Error) {
        // Try to parse the error message for user-friendly display
        try {
          const errorText = error.message;
          console.log("Error message:", errorText);

          if (errorText.includes("Email already registered")) {
            errorMessage =
              "This email address is already registered. Please use a different email address.";
          } else if (errorText.includes("409")) {
            errorMessage =
              "This email address is already registered. Please use a different email address.";
          } else if (errorText.includes("400")) {
            errorMessage = "Please check your information and try again.";
          } else if (errorText.includes("500")) {
            errorMessage = "Server error. Please try again later.";
          } else {
            errorMessage = errorText;
          }
        } catch {
          errorMessage = error.message;
        }
      }

      console.log("Showing toast with message:", errorMessage);
      toast({
        title: "Registration Failed!",
        description: errorMessage,
        variant: "destructive",
        duration: 8000, // Show for 8 seconds
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitCouple = async (data: CoupleFormData) => {
    setIsSubmitting(true);

    const maleGender = getEgyptianIdGender(data.nationalId1.trim());
    const femaleGender = getEgyptianIdGender(data.nationalId2.trim());
    if (maleGender !== "male" || femaleGender !== "female") {
      toast({
        title: "Invalid National IDs!",
        description:
          "Couples package requires exactly one male and one female.",
        variant: "destructive",
        duration: 6000, // Show for 6 seconds
      });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      packageType: "couple" as const,
      contactEmail: data.email1.trim(),
      attendees: [
        {
          fullName: data.fullName1.trim(),
          nationalId: data.nationalId1.trim(),
          gender: "male" as const,
          email: data.email1.trim(),
          phone: data.phone1.trim(),
        },
        {
          fullName: data.fullName2.trim(),
          nationalId: data.nationalId2.trim(),
          gender: "female" as const,
          email: data.email2.trim(),
          phone: data.phone2.trim(),
        },
      ],
    };

    try {
      // Store package type for payment info BEFORE API call
      localStorage.setItem("mm_packageType", "couple");
      console.log("Stored package type: couple");

      await submitManualPaymentTicket(payload);
      toast({
        title: "Registration Successful!",
        description: "Complete your payment to receive your tickets.",
        duration: 5000, // Show for 5 seconds
      });
      prevScrollY.current = window.scrollY; // capture BEFORE swap
      setShowPaymentInfo(true);
    } catch (error) {
      let errorMessage = "Unable to submit registration.";

      if (error instanceof Error) {
        // Try to parse the error message for user-friendly display
        try {
          const errorText = error.message;
          console.log("Error message:", errorText);

          if (errorText.includes("Email already registered")) {
            errorMessage =
              "This email address is already registered. Please use a different email address.";
          } else if (errorText.includes("409")) {
            errorMessage =
              "This email address is already registered. Please use a different email address.";
          } else if (errorText.includes("400")) {
            errorMessage = "Please check your information and try again.";
          } else if (errorText.includes("500")) {
            errorMessage = "Server error. Please try again later.";
          } else {
            errorMessage = errorText;
          }
        } catch {
          errorMessage = error.message;
        }
      }

      console.log("Showing toast with message:", errorMessage);
      toast({
        title: "Registration Failed!",
        description: errorMessage,
        variant: "destructive",
        duration: 8000, // Show for 8 seconds
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showPaymentInfo) {
    return (
      <section id="register" className="py-24 px-4 bg-background">
        <div
          className="container mx-auto max-w-4xl outline-none"
          ref={paymentRootRef}
        >
          <PaymentInfo />
        </div>
      </section>
    );
  }

  return (
    <section id="register" className="py-24 my-10 px-4 bg-background">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h2 className=" text-white text-4xl md:text-5xl mb-4">
            Choose Your <span className="text-[#a22e1f]">Package</span>
          </h2>
          <p className="text-gray-500 text-lg">
            Register now and secure your spot at the event of the year
          </p>
        </div>

        <Card className="border-border/50 shadow-card backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-display text-white text-center">
              Ticket Registration
            </CardTitle>
            <CardDescription className="text-center text-gray-500 text-base">
              {!selectedPackage
                ? "Select your package to continue"
                : "Fill in your details to receive your exclusive QR code ticket"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPackage && (
              <button
                onClick={() => setSelectedPackage(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to packages</span>
              </button>
            )}

            {!selectedPackage ? (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4 sm:gap-6">
                <button
                  onClick={() => setSelectedPackage("single")}
                  className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary p-6 sm:p-8 lg:p-10 transition-all duration-300 hover:shadow-[0_0_40px_rgba(210,58,31,0.35)]"
                >
                  <div className="flex flex-col items-center space-y-3 sm:space-y-4 lg:space-y-5">
                    <div className="rounded-full bg-primary/10 p-5 sm:p-6 lg:p-7 group-hover:bg-primary/20 transition-colors">
                      <User className="w-7 h-7 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-primary" />
                    </div>
                    <h3 className="text-white font-display text-[13px] lg:text-3xl">
                      Single
                    </h3>
                    <p className="text-primary text-[12px] lg:text-4xl font-bold">
                      750 EGP
                    </p>
                    <p className="text-gray-500 text-[13px] lg:text-sm text-center text-sm ">
                      Perfect for solo adventurers
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPackage("couple")}
                  className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-accent p-6 sm:p-8 lg:p-10 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,76,36,0.35)]"
                >
                  <div className="flex flex-col items-center space-y-3 sm:space-y-4 lg:space-y-5">
                    <div className="rounded-full bg-accent/10 p-5 sm:p-6 lg:p-7 group-hover:bg-accent/20 transition-colors">
                      <Users className="w-7 h-7 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-accent" />
                    </div>
                    <h3 className="font-display text-white couple text-[13px] lg:text-3xl">
                      Couple
                    </h3>
                    <p className="text-primary text-[12px] lg:text-4xl font-bold">
                      1,300 EGP
                    </p>
                    <p className="text-gray-500 text-[13px] text-center xl:text-sm ">
                      Share the experience together
                    </p>
                  </div>
                </button>
              </div>
            ) : selectedPackage === "single" ? (
              <form
                onSubmit={singleForm.handleSubmit(onSubmitSingle)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="fullName"
                    className="text-sm text-white font-medium"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    {...singleForm.register("fullName")}
                    className={
                      singleForm.formState.errors.fullName
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {singleForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">
                      {singleForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm text-white font-medium"
                  >
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    {...singleForm.register("phone")}
                    className={
                      singleForm.formState.errors.phone
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {singleForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">
                      {singleForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="singleNationalId"
                    className="text-sm font-medium text-white"
                  >
                    Egyptian National ID
                  </Label>
                  <Input
                    id="singleNationalId"
                    placeholder="14-digit Egyptian ID"
                    inputMode="numeric"
                    {...singleForm.register("nationalId")}
                    className={
                      singleForm.formState.errors.nationalId
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {singleForm.formState.errors.nationalId && (
                    <p className="text-sm text-destructive">
                      {singleForm.formState.errors.nationalId.message}
                    </p>
                  )}
                  {/* optional detected gender helper text omitted for brevity */}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm text-white font-medium"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    {...singleForm.register("email")}
                    className={
                      singleForm.formState.errors.email
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {singleForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {singleForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="premium"
                  size="lg"
                  className="w-full h-14 text-xs"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Register & Get Ticket"}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={coupleForm.handleSubmit(onSubmitCouple)}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="font-display  text-xl  text-[#a22e1f]">
                    Person 1
                  </h3>

                  <div className="space-y-2">
                    <Label
                      htmlFor="fullName1"
                      className="text-sm text-white font-medium"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="fullName1"
                      placeholder="Enter full name"
                      {...coupleForm.register("fullName1")}
                      className={
                        coupleForm.formState.errors.fullName1
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {coupleForm.formState.errors.fullName1 && (
                      <p className="text-sm text-destructive">
                        {coupleForm.formState.errors.fullName1.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone1"
                      className=" text-white text-sm font-medium"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone1"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      {...coupleForm.register("phone1")}
                      className={
                        coupleForm.formState.errors.phone1
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {coupleForm.formState.errors.phone1 && (
                      <p className="text-sm text-destructive">
                        {coupleForm.formState.errors.phone1.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email1"
                      className=" text-white text-sm font-medium"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email1"
                      type="email"
                      placeholder="email@example.com"
                      {...coupleForm.register("email1")}
                      className={
                        coupleForm.formState.errors.email1
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {coupleForm.formState.errors.email1 && (
                      <p className="text-sm text-destructive">
                        {coupleForm.formState.errors.email1.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="nationalId1"
                      className="text-sm text-white font-medium"
                    >
                      Egyptian National ID (Male)
                    </Label>
                    <Input
                      id="nationalId1"
                      placeholder="14-digit Egyptian ID"
                      inputMode="numeric"
                      {...coupleForm.register("nationalId1")}
                      className={
                        coupleForm.formState.errors.nationalId1
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {coupleForm.formState.errors.nationalId1 && (
                      <p className="text-sm text-destructive">
                        {coupleForm.formState.errors.nationalId1.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-display text-xl text-[#a22e1f] ">
                    Person 2
                  </h3>

                  <div className="space-y-2">
                    <Label
                      htmlFor="fullName2"
                      className="text-sm text-white font-medium"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="fullName2"
                      placeholder="Enter full name"
                      {...coupleForm.register("fullName2")}
                      className={
                        coupleForm.formState.errors.fullName2
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {coupleForm.formState.errors.fullName2 && (
                      <p className="text-sm text-destructive">
                        {coupleForm.formState.errors.fullName2.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone2"
                      className=" text-white text-sm font-medium"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone2"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      {...coupleForm.register("phone2")}
                      className={
                        coupleForm.formState.errors.phone2
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {coupleForm.formState.errors.phone2 && (
                      <p className="text-sm text-destructive">
                        {coupleForm.formState.errors.phone2.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email2"
                      className="text-sm text-white font-medium"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email2"
                      type="email"
                      placeholder="email@example.com"
                      {...coupleForm.register("email2")}
                      className={
                        coupleForm.formState.errors.email2
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {coupleForm.formState.errors.email2 && (
                      <p className="text-sm text-destructive">
                        {coupleForm.formState.errors.email2.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="nationalId2"
                      className="text-sm text-white font-medium"
                    >
                      Egyptian National ID (Female)
                    </Label>
                    <Input
                      id="nationalId2"
                      placeholder="14-digit Egyptian ID"
                      inputMode="numeric"
                      {...coupleForm.register("nationalId2")}
                      className={
                        coupleForm.formState.errors.nationalId2
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {coupleForm.formState.errors.nationalId2 && (
                      <p className="text-sm text-destructive">
                        {coupleForm.formState.errors.nationalId2.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="premium"
                  size="lg"
                  className="w-full h-14 text-xs"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Register & Get Tickets"}
                </Button>
              </form>
            )}

            {selectedPackage && (
              <p className="text-center text-sm text-muted-foreground mt-6 leading-relaxed">
                After completing payment, you'll receive an email with your QR
                code ticket{selectedPackage === "couple" ? "s" : ""}.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
