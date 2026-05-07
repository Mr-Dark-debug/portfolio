"use client";

import { Sparkles } from "@/components/ui/sparkles";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useTranslations } from "next-intl";

// Import assets directly
import pythonIcon from "@/components/assets/python.svg";
import tensorflowIcon from "@/components/assets/tensorflow.svg";
import pytorchIcon from "@/components/assets/pytorch.svg";
import reactNativeIcon from "@/components/assets/react-native.svg";
import nodejsIcon from "@/components/assets/nodejs.svg";
import gitIcon from "@/components/assets/git.svg";
import firebaseIcon from "@/components/assets/firebase.svg";
import postgresqlIcon from "@/components/assets/postgresql.svg";
import flutterIcon from "@/components/assets/flutter.png";
import expoIcon from "@/components/assets/expo.png";
import gcloudIcon from "@/components/assets/gcloud.png";
import supabaseIcon from "@/components/assets/supabase.png";

const technologies = [
    { name: "Python", icon: pythonIcon },
    { name: "TensorFlow", icon: tensorflowIcon },
    { name: "PyTorch", icon: pytorchIcon },
    { name: "PostgreSQL", icon: postgresqlIcon },
    { name: "Google Cloud", icon: gcloudIcon },
    { name: "Git", icon: gitIcon },
    { name: "React Native", icon: reactNativeIcon },
    { name: "Flutter", icon: flutterIcon },
    { name: "Expo", icon: expoIcon },
    { name: "Node.js", icon: nodejsIcon },
    { name: "Supabase", icon: supabaseIcon },
    { name: "Firebase", icon: firebaseIcon },
];

export function TechnologiesSection() {
    const { theme } = useTheme();
    const t = useTranslations("Skills");

    return (
        <div className="w-full overflow-hidden relative py-20 bg-background/50">
            <div className="mx-auto w-full max-w-6xl px-4 relative z-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                        {t("title")}
                    </h2>
                    <p className="mt-4 text-muted-foreground text-lg">
                        {t("description")}
                    </p>
                </div>

                {/* Grid with 2 rows on desktop (6 columns) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-8 sm:gap-12 text-zinc-900 dark:text-zinc-200 justify-items-center">
                    {technologies.map((tech) => (
                        <div key={tech.name} className="flex flex-col items-center gap-4 group">
                            <div className="relative w-12 h-12 sm:w-16 sm:h-16 transition-transform group-hover:scale-110">
                                <Image
                                    src={tech.icon}
                                    alt={tech.name}
                                    fill
                                    sizes="(max-width: 640px) 48px, 64px"
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-xs sm:text-sm font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                                {tech.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-96 w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] z-10 pointer-events-none">
                <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,var(--gradient-color),transparent_70%)] before:opacity-40" />
                <div className="absolute -left-1/2 top-1/2 aspect-[1/0.7] z-10 w-[200%] rounded-[100%] border-t border-zinc-900/20 dark:border-white/20 bg-white dark:bg-zinc-900" />
                <Sparkles
                    density={1200}
                    className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
                    color={theme === "dark" ? "var(--sparkles-color)" : "#000000"}
                />
            </div>
        </div>
    );
}
