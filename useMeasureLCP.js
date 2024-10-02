import { useEffect } from "react";

const LCP_SUB_PARTS = ["Time to first byte", "Resource load delay", "Resource load duration", "Element render delay"];

export const useMeasureLCP = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const lcpEntry = list.getEntries().at(-1);
      const navEntry = performance.getEntriesByType("navigation")[0];
      const lcpResEntry = performance.getEntriesByType("resource").filter((e) => e.name === lcpEntry.url)[0];

      if (!lcpEntry.url) return;

      const ttfb = navEntry.responseStart;
      const lcpRequestStart = Math.max(ttfb, lcpResEntry ? lcpResEntry.requestStart || lcpResEntry.startTime : 0);
      const lcpResponseEnd = Math.max(lcpRequestStart, lcpResEntry ? lcpResEntry.responseEnd : 0);
      const lcpRenderTime = Math.max(lcpResponseEnd, lcpEntry ? lcpEntry.startTime : 0);

      LCP_SUB_PARTS.forEach((part) => performance.clearMeasures(part));

      const lcpSubPartMeasures = [
        performance.measure(LCP_SUB_PARTS[0], { start: 0, end: ttfb }),
        performance.measure(LCP_SUB_PARTS[1], { start: ttfb, end: lcpRequestStart }),
        performance.measure(LCP_SUB_PARTS[2], { start: lcpRequestStart, end: lcpResponseEnd }),
        performance.measure(LCP_SUB_PARTS[3], { start: lcpResponseEnd, end: lcpRenderTime }),
      ];

      console.log("LCP value: ", lcpRenderTime);
      console.log("LCP element: ", lcpEntry.element, lcpEntry.url);
      console.table(
        lcpSubPartMeasures.map((measure) => ({
          "LCP sub-part": measure.name,
          "Time (ms)": measure.duration,
          "% of LCP": `${Math.round((1000 * measure.duration) / lcpRenderTime) / 10}%`,
        }))
      );
    });

    observer.observe({ type: "largest-contentful-paint", buffered: true });

    return () => observer.disconnect();
  }, []);

  return null;
};
