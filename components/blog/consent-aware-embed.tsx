"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Github, Instagram, Linkedin, Play, Youtube } from "lucide-react";
import { track } from "@vercel/analytics/react";
import { embedHref, embedLabel, youtubeVideoId, type SocialEmbedProvider } from "@/lib/studio/embed-providers";

const consentKey = "prashant-external-media-consent";

export interface PublicEmbed {
  provider: SocialEmbedProvider;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  stars?: number;
  language?: string;
  start?: number;
}

function ProviderIcon({ provider }: { provider: SocialEmbedProvider }) {
  if (provider === "youtube") return <Youtube aria-hidden="true" />;
  if (provider === "instagram") return <Instagram aria-hidden="true" />;
  if (provider === "linkedin") return <Linkedin aria-hidden="true" />;
  if (provider === "github") return <Github aria-hidden="true" />;
  return <ExternalLink aria-hidden="true" />;
}

export function ConsentAwareEmbed({ embed }: { embed: PublicEmbed }) {
  const [consent, setConsent] = useState<"ask" | "allow" | "deny">("ask");
  useEffect(() => {
    const saved = localStorage.getItem(consentKey);
    if (saved === "allow" || saved === "deny") setConsent(saved);
  }, []);
  const allow = () => {
    localStorage.setItem(consentKey, "allow");
    setConsent("allow");
    track("social_embed_load", { provider: embed.provider });
  };
  const deny = () => {
    localStorage.setItem(consentKey, "deny");
    setConsent("deny");
  };
  const isYouTube = embed.provider === "youtube" && Boolean(youtubeVideoId(embed.url));
  return (
    <section className="studio-consent-card" aria-label={`${embedLabel(embed.provider)} external content`}>
      <div className="studio-consent-card-header">
        <span className="studio-consent-provider"><ProviderIcon provider={embed.provider} /><strong>{embed.title || embedLabel(embed.provider)}</strong></span>
        {consent === "allow" ? <button className="studio-consent-revoke" type="button" onClick={deny}>Hide external content</button> : null}
      </div>
      {embed.description ? <p>{embed.description}</p> : null}
      {embed.provider === "github" && (embed.stars || embed.language) ? <p className="studio-consent-meta">{embed.stars ? `${embed.stars.toLocaleString()} stars` : ""}{embed.stars && embed.language ? " · " : ""}{embed.language || ""}</p> : null}
      {consent === "allow" && isYouTube ? <div className="studio-consent-frame"><iframe src={embedHref(embed.provider, embed.url, embed.start)} title={embed.title || "External video"} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" /></div> : (
        <div className="studio-consent-preview">
          {embed.thumbnail ? <img src={embed.thumbnail} alt="" loading="lazy" /> : <span className="studio-consent-placeholder"><ProviderIcon provider={embed.provider} /></span>}
          <div>
            <strong>{embedLabel(embed.provider)} content stays paused until you allow it.</strong>
            <p>External providers may receive request data when their embed loads. Your preference is stored only in this browser.</p>
            {consent === "ask" ? <div className="studio-consent-actions"><button className="studio-button studio-button-primary" type="button" onClick={allow}><Play aria-hidden="true" /> Load external content</button><button className="studio-button studio-button-quiet" type="button" onClick={deny}>Keep link only</button></div> : consent === "deny" ? <div className="studio-consent-actions"><button className="studio-button studio-button-secondary" type="button" onClick={allow}><Play aria-hidden="true" /> Load when ready</button></div> : null}
          </div>
        </div>
      )}
      <a className="studio-consent-link" href={embed.url} target="_blank" rel="nofollow noopener noreferrer" onClick={() => track(`${embed.provider === "x" ? "x" : embed.provider}_open`)}>Open original on {embedLabel(embed.provider)} <ExternalLink aria-hidden="true" /></a>
    </section>
  );
}

export function MediaPreferencesLink() {
  return <button className="studio-consent-revoke" type="button" onClick={() => { localStorage.removeItem(consentKey); window.location.reload(); }}>External media preferences</button>;
}
