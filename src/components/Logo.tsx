
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <Link to="/" className={cn("flex items-center", className)}>
      <img
        src="/deazons-logo.png"
        alt="Deazons"
        className="max-w-[240px] md:max-w-[280px] h-auto object-contain mix-blend-screen"
        style={{ maxHeight: "90px" }}
      />
    </Link>
  );
};

export default Logo;
