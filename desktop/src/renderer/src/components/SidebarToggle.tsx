import React from "react";

interface SidebarToggleProps {
  onClick: (e?: React.MouseEvent) => void;
  className?: string;
  size?: number;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({
  onClick,
  className = "",
  size = 20,
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 hover:bg-pplx-hover rounded-xl text-pplx-muted transition-all group flex items-center justify-center ${className}`}
      title="Open Sidebar"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform group-hover:scale-110"
      >
        <path
          d="M4 7H20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="transition-all duration-300 group-hover:stroke-pplx-accent"
        />
        <path
          d="M4 12H16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="transition-all duration-300 group-hover:stroke-pplx-accent"
        />
        <path
          d="M4 17H12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="transition-all duration-300 group-hover:stroke-pplx-accent"
        />
      </svg>
    </button>
  );
};
