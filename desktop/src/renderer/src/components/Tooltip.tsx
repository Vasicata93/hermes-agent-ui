import React from "react";

interface TooltipProps {
  text: string;
  position?: "top" | "bottom";
}

export const Tooltip: React.FC<TooltipProps> = ({ text, position = "top" }) => (
  <div
    className={`hidden md:block absolute ${position === "top" ? "-top-10" : "top-10"} left-1/2 !m-0 z-50 pointer-events-none w-max`}
    style={{ transform: "translateX(-50%)" }}
  >
    <div className="animate-fadeIn bg-pplx-card text-pplx-text text-[11px] font-medium py-1 px-2.5 rounded shadow-lg whitespace-nowrap border border-pplx-border relative">
      {text}
      <div
        className={`absolute ${position === "top" ? "-bottom-1" : "-top-1"} left-1/2 border-l-4 border-l-transparent border-r-4 border-r-transparent ${position === "top" ? "border-t-4 border-t-pplx-border" : "border-b-4 border-b-pplx-border"}`}
        style={{ transform: "translateX(-50%)" }}
      />
    </div>
  </div>
);
