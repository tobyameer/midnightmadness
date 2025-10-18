import * as React from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster position="top-right" richColors closeButton expand duration={4000} />
  );
}

export { toast };
