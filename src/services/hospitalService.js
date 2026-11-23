/*
 * VitalSync AI - Healthcare location service
 *
 * Provider: Geoapify Geocoding + Places API
 * No Overpass API calls are made by this service.
 *
 * Required Vite environment variable:
 * VITE_GEOAPIFY_API_KEY=your_key
 */

const GEOAPIFY_GEOCODE_URL =
  "https://api.geoapify.com/v1/geocode/search";

const GEOAPIFY_PLACES_URL =
  "https://api.geoapify.com/v2/places";

const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "";

const CACHE_VERSION = "v1";
const LOCATION_CACHE_KEY = `vitalsync_geoapify_locations_${CACHE_VERSION}`;
const PLACES_CACHE_KEY = `vitalsync_geoapify_places_${CACHE_VERSION}`;
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT = 10000;

const memoryLocationCache = new Map();
const memoryPlacesCache = new Map();
const pendingPlacesRequests = new Map();

function requireApiKey() {
  if (!API_KEY) {
    throw new Error(
      "Geoapify API key is missing. Add VITE_GEOAPIFY_API_KEY to your .env file and restart the Vite server."
    );
  }
}

function readPersistentCache(storageKey, cacheKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    const cache = JSON.parse(raw);
    const entry = cache[cacheKey];

    if (!entry || Date.now() - entry.timestamp > CACHE_DURATION) {
      if (entry) {
        delete cache[cacheKey];
        localStorage.setItem(storageKey, JSON.stringify(cache));
      }
      return null;
    }

    return entry.value;
  } catch {
    return null;
  }
}

function writePersistentCache(storageKey, cacheKey, value) {
  try {
    const raw = localStorage.getItem(storageKey);
    const cache = raw ? JSON.parse(raw) : {};

    cache[cacheKey] = {
      timestamp: Date.now(),
      value
    };

    // Keep the most recent 40 keys to avoid unbounded browser storage.
    const keys = Object.keys(cache);
    if (keys.length > 40) {
      keys
        .sort((a, b) => cache[a].timestamp - cache[b].timestamp)
        .slice(0, keys.length - 40)
        .forEach((key) => delete cache[key]);
    }

    localStorage.setItem(storageKey, JSON.stringify(cache));
  } catch {
    // The in-memory cache still works if browser storage is unavailable.
  }
}

async function fetchJson(url, serviceLabel) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) {
      let message = `${serviceLabel} returned HTTP ${response.status}`;

      try {
        const body = await response.json();
        if (body.message) message = body.message;
        else if (body.error) message = body.error;
      } catch {
        // Keep the HTTP status message.
      }

      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`${serviceLabel} took too long to respond. Please try again.`);
    }

    if (error instanceof TypeError) {
      throw new Error(
        `Could not connect to ${serviceLabel}. Check your internet connection.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatAddress(properties) {
  return (
    properties.formatted ||
    [
      properties.address_line1,
      properties.address_line2,
      properties.city,
      properties.state,
      properties.postcode,
      properties.country
    ]
      .filter(Boolean)
      .join(", ") ||
    "Address not available"
  );
}

function getFacilityCategory(categories = []) {
  const values = categories.map((item) => item.toLowerCase());

  if (values.some((item) => item.includes("healthcare.hospital"))) {
    return "hospital";
  }

  if (values.some((item) => item.includes("healthcare.clinic_or_praxis"))) {
    return "clinic";
  }

  if (values.some((item) => item.includes("healthcare.dentist"))) {
    return "clinic";
  }

  if (values.some((item) => item.includes("healthcare.pharmacy"))) {
    return "pharmacy";
  }

  return "healthcare";
}

function getSpecialty(categories = []) {
  const clinicCategory = categories.find((item) =>
    item.startsWith("healthcare.clinic_or_praxis.")
  );

  if (!clinicCategory) return "Not specified";

  const raw = clinicCategory.split(".").pop();

  return raw
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function mapGeoapifyFeature(feature) {
  const properties = feature.properties || {};
  const coordinates = feature.geometry?.coordinates || [];

  const longitude = Number(properties.lon ?? coordinates[0]);
  const latitude = Number(properties.lat ?? coordinates[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const categories = Array.isArray(properties.categories)
    ? properties.categories
    : [];

  return {
    id: properties.place_id || `${latitude}-${longitude}-${properties.name || "place"}`,
    name: properties.name || properties.address_line1 || "Unnamed healthcare facility",
    category: getFacilityCategory(categories),
    specialty: getSpecialty(categories),
    latitude,
    longitude,
    address: formatAddress(properties),
    phone:
      properties.datasource?.raw?.phone ||
      properties.datasource?.raw?.["contact:phone"] ||
      "Not available",
    website:
      properties.datasource?.raw?.website ||
      properties.datasource?.raw?.["contact:website"] ||
      "",
    // Geoapify returns OSM-derived tags in datasource.raw when available.
    // Emergency status is not guaranteed to be present for every facility.
    emergency: [
      properties.datasource?.raw?.emergency,
      properties.datasource?.raw?.["emergency:phone"],
      ...categories.filter((item) => item.toLowerCase().includes("emergency"))
    ].some((value) => {
      if (typeof value === "string") {
        return ["yes", "true", "1", "designated"].includes(value.toLowerCase());
      }
      return value === true || value === 1;
    }),
    source: "Geoapify Places API"
  };
}

export async function searchLocation(query) {
  requireApiKey();

  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) {
    throw new Error("Please enter a city or location.");
  }

  const cacheKey = cleanQuery.toLowerCase();

  if (memoryLocationCache.has(cacheKey)) {
    return memoryLocationCache.get(cacheKey);
  }

  const persistent = readPersistentCache(LOCATION_CACHE_KEY, cacheKey);
  if (persistent) {
    memoryLocationCache.set(cacheKey, persistent);
    return persistent;
  }

  const params = new URLSearchParams({
    text: cleanQuery,
    format: "json",
    limit: "1",
    filter: "countrycode:in",
    apiKey: API_KEY
  });

  const data = await fetchJson(
    `${GEOAPIFY_GEOCODE_URL}?${params.toString()}`,
    "Geoapify location search"
  );

  const result = data.results?.[0];

  if (!result) {
    throw new Error(
      `No location found for "${cleanQuery}". Try adding the state or country.`
    );
  }

  const location = {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    displayName: result.formatted || cleanQuery
  };

  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    throw new Error("Geoapify returned invalid location coordinates.");
  }

  memoryLocationCache.set(cacheKey, location);
  writePersistentCache(LOCATION_CACHE_KEY, cacheKey, location);

  return location;
}

const CATEGORY_MAP = {
  all: ["healthcare"],
  hospital: ["healthcare.hospital"],
  clinic: ["healthcare.clinic_or_praxis"],
  doctors: ["healthcare.clinic_or_praxis"]
};

export async function findNearbyHospitals(
  latitude,
  longitude,
  radius = 5000,
  facilityType = "all"
) {
  requireApiKey();

  const lat = Number(latitude);
  const lon = Number(longitude);
  const validRadius = Math.min(Math.max(Number(radius) || 5000, 500), 20000);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    throw new Error("Invalid location coordinates.");
  }

  const categories = CATEGORY_MAP[facilityType] || CATEGORY_MAP.all;
  const cacheKey = [
    lat.toFixed(4),
    lon.toFixed(4),
    validRadius,
    categories.join(",")
  ].join("|");

  if (memoryPlacesCache.has(cacheKey)) {
    return memoryPlacesCache.get(cacheKey);
  }

  const persistent = readPersistentCache(PLACES_CACHE_KEY, cacheKey);
  if (persistent) {
    memoryPlacesCache.set(cacheKey, persistent);
    return persistent;
  }

  if (pendingPlacesRequests.has(cacheKey)) {
    return pendingPlacesRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    const params = new URLSearchParams({
      categories: categories.join(","),
      filter: `circle:${lon},${lat},${validRadius}`,
      bias: `proximity:${lon},${lat}`,
      limit: "100",
      lang: "en",
      apiKey: API_KEY
    });

    try {
      const data = await fetchJson(
        `${GEOAPIFY_PLACES_URL}?${params.toString()}`,
        "Geoapify healthcare search"
      );

      if (!Array.isArray(data.features)) {
        throw new Error("Geoapify returned an unexpected places response.");
      }

      const unique = new Map();

      data.features
        .map(mapGeoapifyFeature)
        .filter(Boolean)
        .forEach((place) => unique.set(place.id, place));

      const results = Array.from(unique.values());

      memoryPlacesCache.set(cacheKey, results);
      writePersistentCache(PLACES_CACHE_KEY, cacheKey, results);

      return results;
    } finally {
      pendingPlacesRequests.delete(cacheKey);
    }
  })();

  pendingPlacesRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

export function calculateDistance(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const earthRadius = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;

  const latitudeDifference = toRadians(latitude2 - latitude1);
  const longitudeDifference = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}