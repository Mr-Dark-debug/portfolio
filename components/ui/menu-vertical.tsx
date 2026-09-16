"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import Link from "next/link";

type MenuItem = {
  label: string;
  href: string;
};

interface MenuVerticalProps {
  menuItems: MenuItem[];
  color?: string;
  skew?: number;
  onItemClick?: (item: MenuItem, index: number) => void;
}

const MotionLink = motion.create(Link);

export const MenuVertical = ({
  menuItems = [],
  color = "#ff6900",
  skew = 0,
  onItemClick,
}: MenuVerticalProps) => {
  return (
    <nav aria-label="Portfolio sections" className="flex w-full flex-col gap-1 px-6">
      {menuItems.map((item, index) => (
        <motion.div
          key={`${item.href}-${index}`}
          className="group/nav flex cursor-pointer items-center gap-2 text-zinc-900 dark:text-zinc-50"
          initial="initial"
          whileHover="hover"
        >
          <motion.div
            variants={{
              initial: { x: -16, color: "inherit", opacity: 0 },
              hover: { x: 0, color, opacity: 1 },
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="z-0"
            role="presentation"
          >
            <ArrowRight strokeWidth={3} className="size-4" />
          </motion.div>

          <MotionLink
            href={item.href}
            onClick={() => onItemClick?.(item, index)}
            variants={{
              initial: { x: -16, color: "inherit" },
              hover: { x: 0, color, skewX: skew },
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full rounded-xl px-3 py-2 text-lg font-medium no-underline hover:bg-white/5"
          >
            {item.label}
          </MotionLink>
        </motion.div>
      ))}
    </nav>
  );
};
