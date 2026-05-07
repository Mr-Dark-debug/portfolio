"use client";

import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { FlipWords } from "@/components/ui/flip-words";
import { WordPullUp } from "@/components/ui/word-pull-up";
import { TextEffect } from "@/components/ui/text-effect";
import { MenuVertical } from "@/components/ui/menu-vertical";
import { useScrollTrigger } from "@/hooks/use-scroll-trigger";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Github, Linkedin, Mail, Menu, X, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Timeline } from "@/components/ui/timeline";
import { TechnologiesSection } from "@/components/ui/technologies-section";
import { Dock, DockIcon } from "@/components/ui/dock";
import { ChatSidebar } from "@/components/ui/chat-sidebar";
import GlassmorphismProfileCard from "@/components/ui/glassmorphism-profile-card";
import { GitHubProjects } from "@/components/ui/github-projects";
import { Footer } from "@/components/ui/modem-animated-footer";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

const profileLinks = [
  { href: "https://www.prashant.sbs/", label: "Website" },
  { href: "https://github.com/Mr-Dark-debug", label: "GitHub" },
  { href: "https://www.linkedin.com/in/mr-dark-debug", label: "LinkedIn" },
  { href: "https://youtube.com/@prashantelsewhere", label: "YouTube" },
  { href: "https://www.syntax-blogs.prashant.sbs/", label: "Blog" },
  { href: "https://x.com/prashanttto", label: "X" },
];

export default function HomePage() {
  const t = useTranslations("HomePage");

  const roles = [
    t("roles.ai"),
    t("roles.ml"),
    t("roles.prompt"),
    t("roles.fullstack"),
    t("roles.backend"),
  ];

  const navItems = [
    { label: t("nav.home"), href: "#home" },
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.experience"), href: "#experience" },
    { label: t("nav.education"), href: "#education" },
    { label: t("nav.projects"), href: "#projects" },
    { label: t("nav.skills"), href: "#skills" },
    { label: t("nav.blog"), href: "/blog" },
    { label: t("nav.contact"), href: "#contact" },
  ];

  const isScrolled = useScrollTrigger(100);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleItemClick = () => {
    if (!isDesktop) setIsSidebarOpen(false);
  };

  const openGenerativeAnswers = () => {
    setIsSidebarOpen(false);
    setIsChatOpen(true);
  };

  const renderEntries = (entries: any[]) => (
    <div className="space-y-8 rounded-lg bg-white p-6 shadow-sm">
      {entries.map((entry, index) => (
        <div key={`${entry.title}-${index}`}>
          <h3 className="text-xl font-semibold text-gray-900">{entry.title}</h3>
          {entry.period && <p className="mb-4 text-gray-600">{entry.period}</p>}
          <div className="text-gray-600">
            {entry.meta && <p className="mb-2">{entry.meta}</p>}
            {entry.description && <p className="text-gray-500">{entry.description}</p>}
            {entry.extra && <p className="mt-1 text-sm text-gray-500">{entry.extra}</p>}
            {entry.bullets && (
              <ul className="list-inside list-disc space-y-2 text-sm text-gray-500">
                {entry.bullets.map((bullet: string) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const experienceData = (t.raw("experience.items") as any[]).map((item) => ({
    title: item.year,
    content: renderEntries(item.entries),
  }));

  const educationData = (t.raw("education.items") as any[]).map((item) => ({
    title: item.title,
    content: (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900">{item.heading}</h3>
        <p className="text-gray-600">{item.school}</p>
        {item.period && <p className="mb-2 text-gray-500">{item.period}</p>}
        {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
      </div>
    ),
  }));

  return (
    <>
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="fixed left-4 top-4 z-[60] flex min-h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-lg backdrop-blur transition hover:shadow-xl hover:text-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-50 dark:hover:text-purple-400"
          aria-expanded={isSidebarOpen}
          aria-controls="portfolio-sidebar"
          aria-label={isSidebarOpen ? t("a11y.closeMenu") : t("a11y.openMenu")}
        >
          {isSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="hidden sm:inline">{t("buttons.menu")}</span>
        </button>
      )}

      {!isChatOpen && !isSidebarOpen && (
        <div className="fixed right-4 top-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={openGenerativeAnswers}
            aria-label={t("a11y.openChat")}
            className="flex min-h-10 items-center gap-2 rounded-xl border border-purple-300/50 bg-gradient-to-r from-purple-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 backdrop-blur transition hover:from-purple-700 hover:to-violet-700 hover:shadow-xl hover:shadow-purple-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 sm:px-4 sm:py-2.5"
          >
            <Sparkles className="h-5 w-5" />
            <span className="hidden xs:inline sm:inline">{t("buttons.askAi")}</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              key="sidebar"
              id="portfolio-sidebar"
              className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-zinc-200 bg-white/95 pb-10 pt-16 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <MenuVertical menuItems={navItems} color="#A78BFA" skew={-8} onItemClick={handleItemClick} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main
        className={cn(
          "min-h-screen bg-white transition-[padding] duration-300 dark:bg-zinc-950",
          isSidebarOpen ? "lg:pl-72" : "lg:pl-0",
        )}
      >
        <section id="home" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-20 sm:px-6 sm:py-32">
          <AnimatedGridPattern
            className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
            numSquares={30}
            maxOpacity={0.15}
            duration={5}
          />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-8 lg:flex-row lg:gap-16">
            <div className="hidden flex-1 flex-col items-center md:flex lg:items-center">
              <TextEffect preset="slide" trigger={!isScrolled} className="block text-center" as="div" delay={0.2} duration={0.8}>
                <WordPullUp
                  words={t("title")}
                  className="mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl lg:text-7xl"
                />
              </TextEffect>

              <TextEffect preset="scale" trigger={!isScrolled} delay={0.5} duration={0.8} className="block" as="div">
                <div className="mb-8 flex items-center justify-center gap-2 text-lg text-gray-600 sm:text-xl md:text-2xl">
                  <span>{t("hero.iam")}</span>
                  <FlipWords words={roles} className="font-semibold text-purple-600 dark:text-purple-400" duration={4000} />
                </div>
              </TextEffect>

              <TextEffect preset="fade" trigger={!isScrolled} delay={0.8} duration={1} as="div" className="flex justify-center">
                <Dock direction="middle" className="border-gray-200/10 bg-white/5" magnification={35} distance={80}>
                  <DockIcon>
                    <Link aria-label={t("a11y.linkedin")} href="https://www.linkedin.com/in/mr-dark-debug" target="_blank" className="text-gray-600 transition-all duration-500 hover:text-purple-500">
                      <Linkedin className="size-5 sm:size-6" />
                    </Link>
                  </DockIcon>
                  <DockIcon>
                    <Link aria-label={t("a11y.github")} href="https://github.com/Mr-Dark-debug" target="_blank" className="text-gray-600 transition-all duration-500 hover:text-purple-500">
                      <Github className="size-5 sm:size-6" />
                    </Link>
                  </DockIcon>
                  <DockIcon>
                    <Link aria-label={t("a11y.email")} href="mailto:prashantc592114@gmail.com" className="text-gray-600 transition-all duration-500 hover:text-purple-500">
                      <Mail className="size-5 sm:size-6" />
                    </Link>
                  </DockIcon>
                </Dock>
              </TextEffect>
            </div>

            <div className="flex w-full flex-shrink-0 flex-col items-center md:w-auto">
              <GlassmorphismProfileCard
                name="Prashant Choudhary"
                role={t("hero.profileRole")}
                email="prashantc592114@gmail.com"
                statusText={t("hero.available")}
                glowText={t("hero.future")}
              />
            </div>
          </div>
        </section>

        <section id="about" className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-purple-600">{t("about.eyebrow")}</p>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{t("about.title")}</h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">{t("about.description")}</p>
              <p className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm font-medium text-purple-900 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-100">
                {t("about.masters")}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/70">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">{t("about.linksLabel")}</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {profileLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-purple-300 hover:text-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    {link.label}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="px-4 py-16 sm:px-6 sm:py-20">
          <Timeline data={experienceData} title={t("experience.title")} description={t("experience.description")} progressBarColors={{ from: "indigo-500", via: "violet-500" }} />
        </section>

        <section id="education" className="px-4 py-16 sm:px-6 sm:py-20">
          <Timeline data={educationData} title={t("education.title")} description={t("education.description")} progressBarColors={{ from: "emerald-500", via: "teal-500" }} />
        </section>

        <GitHubProjects username="Mr-Dark-debug" organizations={["PocketLLM", "syntaxandsips", "codex-clone"]} maxProjects={30} />

        <section id="skills" className="w-full">
          <TechnologiesSection />
        </section>

        <Footer
          brandName="Prashant Choudhary"
          brandDescription={t("footer.description")}
          socialLinks={[
            { icon: <Github className="h-6 w-6" />, href: "https://github.com/Mr-Dark-debug", label: "GitHub" },
            { icon: <Linkedin className="h-6 w-6" />, href: "https://www.linkedin.com/in/mr-dark-debug", label: "LinkedIn" },
            { icon: <Mail className="h-6 w-6" />, href: "mailto:prashantc592114@gmail.com", label: "Email" },
          ]}
          navLinks={navItems}
          creatorName="Prashant Choudhary"
          creatorUrl="https://github.com/Mr-Dark-debug"
          brandIcon={<Image src="/professional.png" alt={t("hero.profileAlt")} width={80} height={80} className="h-full w-full rounded-xl object-cover" />}
        />

        <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </main>
    </>
  );
}
