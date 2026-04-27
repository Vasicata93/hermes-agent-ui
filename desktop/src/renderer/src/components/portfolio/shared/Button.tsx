import React from 'react';

const Button: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string; variant?: "accent" | "secondary"; size?: "sm" | "md"; type?: "button" | "submit" }> = ({ children, onClick, className = "", variant = "accent", size = "md", type = "button" }) => {
  const baseClass = "inline-flex items-center justify-center font-black rounded-xl transition-all active:scale-95";
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const variantClass = variant === "accent" ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white shadow-md" : "bg-gray-100 dark:bg-pplx-secondary text-gray-900 dark:text-zinc-100 hover:bg-gray-200 dark:hover:bg-pplx-hover";
  return <button type={type} onClick={onClick} className={`${baseClass} ${sizeClass} ${variantClass} ${className}`}>{children}</button>;
};

export default Button;
