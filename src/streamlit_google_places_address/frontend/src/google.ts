let googleMapsPromise: Promise<void> | null = null;

declare global {
  interface Window {
    google?: typeof google;
  }
}

function injectGoogleMapsBootstrap(apiKey: string): void {
  const w = window as Window & { google?: any };

  ((g: Record<string, string>) => {
    let h: Promise<void> | undefined;
    let a: HTMLScriptElement;
    let k: string;
    const c = "google";
    const l = "importLibrary";
    const q = "__ib__";
    const m = document;
    let b: any = w;

    b = b[c] || (b[c] = {});
    const d = b.maps || (b.maps = {});
    const r = new Set<string>();
    const e = new URLSearchParams();

    const u = () =>
      h ||
      (h = new Promise<void>((resolve, reject) => {
        a = m.createElement("script");
        e.set("libraries", [...r].join(","));

        for (k in g) {
          e.set(
            k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()),
            g[k]
          );
        }

        e.set("callback", `${c}.maps.${q}`);
        a.src = `https://maps.googleapis.com/maps/api/js?${e.toString()}`;
        d[q] = () => resolve();
        a.onerror = () =>
          reject(new Error("Google Maps JavaScript API could not load."));
        a.async = true;
        const nonce = m.querySelector("script[nonce]")?.getAttribute("nonce") || "";
        a.nonce = nonce;
        m.head.append(a);
      }));

    d[l] = (library: string, ...args: any[]) =>
      r.add(library) && u().then(() => d[l](library, ...args));
  })({
    key: apiKey,
    v: "weekly",
  });
}

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (!apiKey) {
    return Promise.reject(new Error("Missing Google Maps API key."));
  }

  const isLoaded = !!window.google?.maps;

  if (isLoaded) {
    return Promise.resolve();
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    try {
      injectGoogleMapsBootstrap(apiKey);
    } catch (err) {
      googleMapsPromise = null;
      reject(
        err instanceof Error
          ? err
          : new Error("Failed to initialize Google Maps bootstrap.")
      );
      return;
    }

    const started = Date.now();

    const checkReady = () => {
      const loaded = !!window.google?.maps;

      if (loaded) {
        resolve();
        return;
      }

      if (Date.now() - started > 10000) {
        googleMapsPromise = null;
        reject(new Error("Google Maps API failed to initialize."));
        return;
      }

      setTimeout(checkReady, 25);
    };

    checkReady();
  }).catch((err) => {
    googleMapsPromise = null;
    throw err;
  });

  return googleMapsPromise;
}