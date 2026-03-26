import { FrontendRendererArgs } from "@streamlit/component-v2-lib";
import React, { FC, ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { loadGoogleMaps } from "./google";

export type AddressSearchStateShape = {
  value: {
    place_id: string | null;
    description: string;
    main_text: string;
    secondary_text: string;
    formatted_address: string;
    lat: number | null;
    lng: number | null;
  } | null;
};

export type AddressSearchDataShape = {
  apiKey: string;
  placeholder?: string;
  value?: string;
  country?: string | null;
  disabled?: boolean;
  theme?: "auto" | "light" | "dark";
};

export type AddressSearchProps = Pick<
  FrontendRendererArgs<AddressSearchStateShape, AddressSearchDataShape>,
  "setStateValue"
> & {
  data: AddressSearchDataShape;
};

const AddressSearch: FC<AddressSearchProps> = ({
  data,
  setStateValue,
}): ReactElement => {
  const apiKey = String(data.apiKey ?? "");
  const placeholder = String(data.placeholder ?? "Search for an address");
  const initialValue = String(data.value ?? "");
  const country = data.country ? String(data.country).toLowerCase() : null;
  const disabled = Boolean(data.disabled ?? false);
  const theme = data.theme ?? "auto";

  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<number | null>(null);
  const suppressFetchRef = useRef(false);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    let cancelled = false;

    sessionTokenRef.current = null;
    setError(null);
    setReady(false);
    setSuggestions([]);
    setHighlightedIndex(-1);

    async function init() {
      if (!apiKey) {
        setError("Missing Google Maps API key.");
        return;
      }

      try {
        await loadGoogleMaps(apiKey);
        await google.maps.importLibrary("places");

        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setReady(false);
          setError(
            err instanceof Error ? err.message : "Failed to initialize Google Places."
          );
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const canSearch = useMemo(
    () => ready && !disabled && inputValue.trim().length > 0,
    [ready, disabled, inputValue]
  );

  async function fetchSuggestions(query: string) {
    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
      setHighlightedIndex(-1);
      sessionTokenRef.current = null;
      return;
    }

    try {
      setLoading(true);

      const { AutocompleteSessionToken, AutocompleteSuggestion } =
        (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;

      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new AutocompleteSessionToken();
      }

      const request: google.maps.places.AutocompleteRequest = {
        input: query,
        sessionToken: sessionTokenRef.current,
        language: "en-US",
      };

      if (country) {
        request.includedRegionCodes = [country];
      }

      const { suggestions } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      setSuggestions((suggestions ?? []));
      setHighlightedIndex(-1);
      setError(null);
    } catch (err) {
      console.error("Autocomplete request failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch autocomplete suggestions."
      );
      setSuggestions([]);
      sessionTokenRef.current = null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (suppressFetchRef.current) {
      suppressFetchRef.current = false;
      return;
    }

    if (!canSearch) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      void fetchSuggestions(inputValue);
    }, 250);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, canSearch]);

  async function selectSuggestion(item: google.maps.places.AutocompleteSuggestion) {
    const prediction = item.placePrediction;
    if (!prediction?.toPlace) {
      return;
    }

    try {
      const place = prediction.toPlace();

      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location"],
      });

      const payload = {
        place_id: place.id ?? null,
        description: prediction.text?.text ?? "",
        main_text: prediction.mainText?.text ?? "",
        secondary_text: prediction.secondaryText?.text ?? "",
        formatted_address: place.formattedAddress ?? "",
        lat: place.location?.lat ? place.location.lat() : null,
        lng: place.location?.lng ? place.location.lng() : null,
      };

      suppressFetchRef.current = true;

      setInputValue(payload.formatted_address || payload.description);
      setSuggestions([]);
      setHighlightedIndex(-1);
      setError(null);

      setStateValue("value", payload);

      sessionTokenRef.current = null;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch place details."
      );
      sessionTokenRef.current = null;
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected =
        highlightedIndex >= 0 ? suggestions[highlightedIndex] : suggestions[0];
      if (selected) {
        void selectSuggestion(selected);
      }
    } else if (event.key === "Escape") {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  }

  return (
    <div
      className="address-search-root"
      data-theme={theme}
      tabIndex={-1}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (!e.currentTarget.contains(next)) {
          setSuggestions([]);
          setHighlightedIndex(-1);
        }
      }}
    >
      <div className="react-root-inner">
        <input
          className="address-input"
          type="text"
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />

        {loading && <div className="status-text">Loading suggestions...</div>}
        {error && <div className="error-text">{error}</div>}

        {suggestions.length > 0 && (
          <ul className="suggestions-list" role="listbox">
            {suggestions.map((item, index) => {
              const main =
                item.placePrediction?.mainText?.text ??
                item.placePrediction?.text?.text ??
                "";

              const secondary =
                item.placePrediction?.secondaryText?.text ?? "";

              return (
                <li
                  key={`${main}-${secondary}-${index}`}
                  tabIndex={0}
                  className={
                    index === highlightedIndex
                      ? "suggestion-item highlighted"
                      : "suggestion-item"
                  }
                  onMouseDown={(e) => {
                    e.preventDefault();
                    void selectSuggestion(item);
                  }}
                >
                  <div className="suggestion-main">{main}</div>
                  {secondary && (
                    <div className="suggestion-secondary">{secondary}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AddressSearch;