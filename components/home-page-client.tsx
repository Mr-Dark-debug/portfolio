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
import { CareerSections } from "@/components/career-sections";
import { SelectedWork } from "@/components/selected-work";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { TechnologiesSection } from "@/components/ui/technologies-section";
import OnboardingForm from "@/components/ui/onboarding-form";
import { Dock, DockIcon } from "@/components/ui/dock";
import { ChatSidebar } from "@/components/ui/chat-sidebar";
import GlassmorphismProfileCard from "@/components/ui/glassmorphism-profile-card";
import { GitHubProjects } from "@/components/ui/github-projects";
import { Footer } from "@/components/ui/modem-animated-footer";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { resume } from "@/lib/resume";
import { ContactForm } from "@/components/ui/contact-form";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import HomeSocialSignals from "@/components/home-social-signals";
import type { SocialItem } from "@/lib/studio/schema";

const profileLinks = [
  { href: "https://prashant.sbs/", label: "Website" },
  { href: "https://github.com/Mr-Dark-debug", label: "GitHub" },
  { href: "https://www.linkedin.com/in/mr-dark-debug", label: "LinkedIn" },
  { href: "https://youtube.com/@prashantelsewhere", label: "YouTube" },
  { href: "__BLOG__", label: "Blog" },
  { href: "https://x.com/prashanttto", label: "X" },
];

export default function HomePage({ hero, socialItems }: { hero: React.ReactNode; socialItems: SocialItem[] }) {
  const locale = useLocale();
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
    { label: t("nav.projects"), href: "#selected-work" },
    { label: t("nav.skills"), href: "#skills" },
    { label: t("nav.blog"), href: `/${locale}/blog` },
    { label: "Résumé", href: `/${locale}/resume` },
    { label: "Services", href: `/${locale}/services/saas-mvp` },
    { label: t("nav.contact"), href: "#contact" },
  ];

  const isScrolled = useScrollTrigger(100);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') { setIsSidebarOpen(false); setIsChatOpen(false); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  const handleItemClick = () => {
    if (!isDesktop) setIsSidebarOpen(false);
  };

  const openGenerativeAnswers = () => {
    setIsSidebarOpen(false);
    setIsChatOpen(true);
  };

  return (
    <>
      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          suppressHydrationWarning
          className="fixed left-4 top-4 z-[60] flex min-h-10 items-center gap-2 rounded-full border border-zinc-200 bg-[#0b1235]/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:shadow-xl hover:text-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-50 dark:hover:text-purple-400"
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
            suppressHydrationWarning
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
              aria-label="Portfolio sections"
              className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-white/10 bg-[#0b1235]/95 pb-10 pt-16 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-[#0b1235]/95"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <MenuVertical menuItems={navItems} color="#A78BFA" skew={0} onItemClick={handleItemClick} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main
        className={cn(
          "portfolio-home night-shell min-h-screen transition-[padding] duration-300",
          isSidebarOpen ? "lg:pl-72" : "lg:pl-0",
        )}
      >
        <section id="home" className="relative flex min-h-[850px] lg:min-h-[100svh] items-center justify-center overflow-hidden px-4 py-20 sm:px-6 sm:py-32">
          <Image src="/images/hero-night-meadow.webp" alt="" fill priority sizes="100vw" quality={85} className="object-cover object-center" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#050729]/50 via-[#080b34]/40 to-[#080c22]" />
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-16 lg:flex-row lg:gap-16">
            {hero}

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

        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-5 border-b border-white/10 px-6 py-8 text-sm"><span className="text-lime-200">Open to Werkstudent opportunities</span><span>Trier, Germany · Europe/Berlin</span><a href="/resume/Prashant_Choudhary_CV_EN.pdf" download>CV · EN ↓</a><a href="/resume/Prashant_Choudhary_CV_DE.pdf" download>Lebenslauf · DE ↓</a></div>
        <section id="about" className="editorial-section about-editorial"><header className="editorial-heading"><div><p className="eyebrow">A little about me</p><h2>The person<br/>behind the work<span>.</span></h2></div></header><div className="about-note"><div className="about-note-copy"><p className="about-hello">Hello, I’m Prashant.</p><p>{resume.summary}</p><p>{resume.approach}</p><p>I’m currently looking for student-compatible opportunities in AI/ML, Python backend development and NLP.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#contact" className="meadow-button">Let’s talk ↗</a><Link href={`/${locale}/resume`} className="outline-button">View résumé</Link></div><div className="about-socials">{profileLinks.filter(l=>['GitHub','LinkedIn','Blog'].includes(l.label)).map(link=><Link key={link.label} href={link.href==='__BLOG__'?`/${locale}/blog`:link.href}>{link.label} ↗</Link>)}</div></div><div className="about-portrait"><Image src="/professional.png" alt="Prashant Choudhary" fill sizes="(max-width: 768px) 80vw, 420px" className="object-cover object-top"/><div className="portrait-caption"><span className="status-dot"/> Based in Trier. Building everywhere.</div></div></div></section>

        <CareerSections />
        <SelectedWork locale={locale}/>
        <GitHubProjects username="Mr-Dark-debug" organizations={["PocketLLM", "syntaxandsips", "codex-clone"]} maxProjects={6} />
        <HomeSocialSignals items={socialItems} locale={locale} />

        <section id="skills" className="w-full">
          <TechnologiesSection />
        </section>

        <section id="contact" className="contact-work-section">
          <BackgroundBeams />
          <div className="contact-work-inner"><div className="contact-work-intro"><p className="eyebrow">04 / Let’s make something useful</p><h2>A conversation is<br/>a good place to start<span>.</span></h2><p>Have a role in mind, a technical question or a product you want to build? Choose the detail that suits your idea.</p></div>
          <div className="contact-work-grid"><div className="contact-column"><p className="form-eyebrow">A quick hello</p><ContactForm compact/></div><div id="onboarding" className="onboarding-column"><p className="form-eyebrow">A little more detail</p><h3>Ready to start your project?</h3><p className="form-intro">Share the goals, scope and timeline. We’ll start with what matters most.</p><OnboardingForm /></div></div>
          <div className="contact-work-foot"><a href="mailto:prashantc592114@gmail.com">prashantc592114@gmail.com ↗</a><span>Trier, Germany · Europe/Berlin</span></div></div>
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
