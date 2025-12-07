"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (
      !GA_MEASUREMENT_ID ||
      typeof window === "undefined" ||
      typeof window.gtag !== "function"
    ) {
      return;
    }

    const url =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    window.gtag("event", "page_view", {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}

