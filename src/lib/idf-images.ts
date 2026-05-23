/**
 * IDF photography — see idf-photo-catalog.ts for per-image credits and keywords.
 */
export {
  IDF_PHOTO_CATALOG,
  IDF_BACKDROP_IMAGE_URLS,
  ATTRIBUTION_HE,
  pickRolePhoto,
  getIdfPhoto,
  idfPhotoAt,
  idfPhotosForIds,
  type IdfPhoto,
} from "./idf-photo-catalog";

import { IDF_BACKDROP_IMAGE_URLS, IDF_PHOTO_CATALOG } from "./idf-photo-catalog";

const byId = Object.fromEntries(IDF_PHOTO_CATALOG.map((p) => [p.id, p.src])) as Record<string, string>;

export const IDF_IMAGE_KFIR_TRAINING_1600 = byId["kfir-training"];
export const IDF_IMAGE_BORDER_PREP_1600 = byId["border-prep"];
export const IDF_IMAGE_NAHAL_MARCH_1600 = byId["nahal-march"];
export const IDF_IMAGE_NAVY_TRAINING_1600 = byId["navy-training"];
export const IDF_IMAGE_PARATROOPERS_1600 = byId["paratroopers"];
export const IDF_IMAGE_ALPINE_TRAINING = byId["alpine-training"];
export const IDF_IMAGE_OFFICER_GRADUATION = byId["officer-graduation"];
export const IDF_IMAGE_SOLDIERS_SNOW = byId["soldiers-snow"];
export const IDF_IMAGE_SOLDIERS_CLIMBING = byId["soldiers-climbing"];

const preloadedHrefs = new Set<string>();

function backdropPreloadAlreadyInHead(href: string): boolean {
  if (typeof document === "undefined") return false;
  return [...document.querySelectorAll('link[rel="preload"][as="image"]')].some(
    (el) => el.getAttribute("href") === href
  );
}

export function preloadIdfBackdropImages(): void {
  if (typeof document === "undefined") return;
  for (const href of IDF_BACKDROP_IMAGE_URLS) {
    if (preloadedHrefs.has(href)) continue;
    if (backdropPreloadAlreadyInHead(href)) {
      preloadedHrefs.add(href);
      continue;
    }
    preloadedHrefs.add(href);
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    document.head.appendChild(link);
  }
}
