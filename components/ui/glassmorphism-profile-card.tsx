"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image, { StaticImageData } from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, Plus, Copy, Zap } from "lucide-react";
import professionalImg from "@/components/assets/me/professional.png";

interface GlassmorphismProfileCardProps {
    name?: string;
    role?: string;
    email?: string;
    avatarSrc?: string | StaticImageData;
    statusText?: string;
    statusColor?: string;
    glowText?: string;
    className?: string;
}

export default function GlassmorphismProfileCard({
    name = "Prashant Choudhary",
    role = "AI Engineer & Full Stack Developer",
    email = "prashantc592114@gmail.com",
    avatarSrc = professionalImg,
    statusText = "Available for work",
    statusColor = "bg-lime-500",
    glowText = "Currently High on Creativity",
    className,
}: GlassmorphismProfileCardProps) {
    const [copied, setCopied] = useState(false);
    const [timeText, setTimeText] = useState("");

    // Derive a local clock text once per minute on the client
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const h = Number(new Intl.DateTimeFormat("en-GB", {timeZone:"Europe/Berlin",hour:"2-digit",hourCycle:"h23"}).format(now));
            const m = now.getMinutes().toString().padStart(2, "0");
            const hour12 = ((h + 11) % 12) + 1;
            const ampm = h >= 12 ? "PM" : "AM";
            setTimeText(`${hour12}:${m}${ampm}`);
        };

        updateClock();
        const interval = setInterval(updateClock, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { }
    };

    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn("relative w-full max-w-sm", className)}
        >
            {/* Glow effect - Lavender */}
            <div className="pointer-events-none absolute inset-x-3 -bottom-10 top-[90%] rounded-[28px] bg-purple-400/90 blur-0 shadow-[0_40px_80px_-16px_rgba(167,139,250,0.8)] z-0" />

            {/* Glow text */}
            <div className="absolute inset-x-0 -bottom-10 mx-auto w-full z-0">
                <div className="flex items-center justify-center gap-2 bg-transparent py-3 text-center text-sm font-medium text-white">
                    <Zap className="h-4 w-4" /> {glowText}
                </div>
            </div>

            <Card
                className={cn(
                    "relative z-10 mx-auto w-full max-w-3xl overflow-visible rounded-[20px]",
                    "bg-[#101538]/80 dark:bg-[#101538]/80 backdrop-blur-xl",
                    "border border-black/20 dark:border-white/10",
                    "shadow-lg shadow-black/20 hover:shadow-black/10"
                )}
            >
                <CardContent className="p-6 sm:p-8">
                    <div className="mb-6 flex items-center justify-between text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    "inline-block h-2.5 w-2.5 rounded-full animate-pulse",
                                    statusColor
                                )}
                            />
                            <span className="select-none">{statusText}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-80">
                            <Clock className="h-4 w-4" />
                            <span title="Europe/Berlin" className="tabular-nums">{timeText}</span>
                        </div>
                    </div>

                    {/* Avatar and Info */}
                    <div className="flex flex-col justify-center items-center gap-5">
                        <div className="relative h-52 w-52 shrink-0 overflow-hidden rounded-[20px] ring-2 ring-white/10">
                            <Image
                                src={avatarSrc}
                                alt={`${name} avatar`}
                                fill
                                sizes="208px"
                                className="object-cover"
                            />
                        </div>
                        <div className="min-w-0 text-center">
                            <h3 className="truncate text-xl font-semibold tracking-tight sm:text-3xl text-white">
                                {name}
                            </h3>
                            <p className="mt-0.5 text-sm text-slate-300 dark:text-slate-300">
                                {role}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Button
                            variant="outline"
                            asChild
                            className="h-12 justify-center gap-3 rounded-2xl bg-white/10 dark:bg-white/10 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        >
                            <a href={`mailto:${email}?subject=Hiring Inquiry - Let's Work Together&body=Hi Prashant,%0D%0A%0D%0AI came across your portfolio and I'm interested in discussing a potential opportunity with you.%0D%0A%0D%0AProject/Role: [Please describe]%0D%0ATimeline: [Expected timeline]%0D%0ABudget/Compensation: [If applicable]%0D%0A%0D%0ALooking forward to hearing from you!%0D%0A%0D%0ABest regards,%0D%0A[Your Name]`}>
                                <Plus className="h-4 w-4" /> Hire Me
                            </a>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleCopy}
                            className="h-12 justify-center gap-3 rounded-2xl bg-white/10 dark:bg-white/10 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        >
                            <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy Email"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
