import { useEffect } from "react";

interface MetaOptions {
  title?: string;
  description?: string;
  image?: string;
  themeColor?: string;
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name"): void {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Lightweight SEO hook — sets title, description and Open Graph tags.
 * No third-party deps. Reverts to defaults on unmount.
 */
export function useDocumentMeta({ title, description, image, themeColor }: MetaOptions): void {
  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? "";
    const prevTheme = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content ?? "";

    if (title) document.title = title;
    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, "property");
      setMeta("twitter:description", description);
    }
    if (title) {
      setMeta("og:title", title, "property");
      setMeta("twitter:title", title);
    }
    if (image) {
      setMeta("og:image", image, "property");
      setMeta("twitter:image", image);
      setMeta("twitter:card", "summary_large_image");
    }
    if (themeColor) setMeta("theme-color", themeColor);
    setMeta("og:type", "website", "property");
    setMeta("og:url", window.location.href, "property");

    return () => {
      document.title = prevTitle;
      if (prevDesc) setMeta("description", prevDesc);
      if (prevTheme) setMeta("theme-color", prevTheme);
    };
  }, [title, description, image, themeColor]);
}
