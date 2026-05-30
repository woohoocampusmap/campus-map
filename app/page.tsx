"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";

const PhotoMap = dynamic(
  () => import("../components/PhotoMap"),
  { ssr: false }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Location = {
  lat: number;
  lng: number;
};

type Photo = {
  id: number;
  image_url: string;
  lat: number;
  lng: number;
  caption: string | null;
  created_at: string;
};

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [caption, setCaption] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  async function loadPhotos() {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setPhotos(data);
    }
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  function getLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => {
          console.log(err);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }

  async function handleAddLocation() {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("geolocation-not-supported");
      return;
    }

    setStatus("Finding your spot...");

    try {
      const loc = await getLocation();
      setLocation(loc);
      setStatus("Location locked in ✔");
      setLocationError(null);
    } catch (err: any) {
      console.log(err);
      setStatus("");

      if (err?.code === 1) {
        setLocationError("permission-denied");
      } else if (err?.code === 2) {
        setLocationError("position-unavailable");
      } else if (err?.code === 3) {
        setLocationError("timeout");
      } else {
        setLocationError("unknown-error");
      }
    }
  }

  async function upload() {
    if (!file || !location) return;

    setLoading(true);
    setStatus("Uploading...");

    const fileName = `photo-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(fileName, file);

    if (uploadError) {
      setStatus(uploadError.message);
      setLoading(false);
      return;
    }

    const imageUrl =
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}` +
      `/storage/v1/object/public/photos/${fileName}`;

    const { error: dbError } = await supabase
      .from("photos")
      .insert({
        image_url: imageUrl,
        lat: location.lat,
        lng: location.lng,
        caption,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      setStatus(dbError.message);
      setLoading(false);
      return;
    }

    await loadPhotos();

    setStatus("Posted ✔");
    setPosted(true);
    setLoading(false);
  }

  function reset() {
    setFile(null);
    setLocation(null);
    setStatus("");
    setPosted(false);
    setCaption("");
    setLocationError(null);
  }

  const uniqueLocations = new Set(
    photos
      .map((p) => p.caption?.trim())
      .filter(Boolean)
  ).size;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#12082a] via-[#4c1d95] to-[#8b5cf6] flex flex-col items-center px-6 py-8">

      <div className="w-full max-w-md text-center mb-8">

        <div className="text-6xl font-black text-white">
          {uniqueLocations}
        </div>

        <div className="text-purple-200 text-sm mt-2">
          Locations Mapped
        </div>

        <h1 className="text-3xl font-bold text-white mt-6">
          Campus
        </h1>

      </div>

      {posted ? (
        <div className="w-full max-w-md space-y-5">

          <div className="aspect-[3/4] rounded-[32px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center">

            <div className="text-center">
              <div className="text-5xl mb-4">✨</div>

              <div className="text-white text-xl font-bold">
                Posted
              </div>

              <div className="text-purple-200 mt-2">
                Your photo is now part of the map.
              </div>
            </div>

          </div>

          <button
            onClick={reset}
            className="w-full py-4 rounded-3xl bg-white text-black font-bold"
          >
            Post Another
          </button>

        </div>
      ) : (
        <>
          <div className="w-full max-w-md mb-5">

            <div className="aspect-[3/4] rounded-[32px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden flex items-center justify-center">

              {file ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">📸</div>

                  <div className="font-semibold">
                    Capture a Moment
                  </div>

                  <div className="text-sm text-purple-200 mt-2">
                    Add a place to the map
                  </div>
                </div>
              )}

            </div>

          </div>

          <div className="w-full max-w-md mb-4 text-center">

            {location ? (
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/20 border border-green-400/30 text-green-100 text-sm">
                📍 Location Added
              </div>
            ) : (
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-purple-100 text-sm">
                No Location Yet
              </div>
            )}

          </div>

          <div className="w-full max-w-md space-y-3">

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) =>
                setFile(e.target.files?.[0] ?? null)
              }
              className="hidden"
              id="camera"
            />

            <label
              htmlFor="camera"
              className="block w-full text-center py-4 rounded-3xl bg-white text-black font-bold cursor-pointer"
            >
              Take Photo
            </label>

            <button
              onClick={handleAddLocation}
              className="w-full py-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold"
            >
              Add Location
            </button>

            {locationError && (
              <div className="rounded-3xl bg-red-500/20 border border-red-400/30 p-4 text-sm text-red-100">
                {locationError === "permission-denied" && (
                  <div>
                    <div className="font-bold mb-2">Location access denied</div>
                    <div className="text-xs">
                      Safari: Phone Settings → Safari → Location → Allow
                    </div>
                    <div className="text-xs mt-1">
                      Chrome: Phone Settings → Chrome → Location → Allow
                    </div>
                  </div>
                )}
                {locationError === "geolocation-not-supported" && (
                  <div>
                    <div className="font-bold">Geolocation not supported</div>
                    <div className="text-xs mt-1">Try a different browser or device</div>
                  </div>
                )}
                {locationError === "position-unavailable" && (
                  <div>
                    <div className="font-bold">Unable to get your location</div>
                    <div className="text-xs mt-1">Check your GPS connection and try again</div>
                  </div>
                )}
                {locationError === "timeout" && (
                  <div>
                    <div className="font-bold">Location request timed out</div>
                    <div className="text-xs mt-1">Try again or check your GPS signal</div>
                  </div>
                )}
                {locationError === "unknown-error" && (
                  <div>
                    <div className="font-bold">Unable to get location</div>
                    <div className="text-xs mt-1">Please try again</div>
                  </div>
                )}
              </div>
            )}

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Location name"
              className="w-full py-4 px-4 rounded-3xl bg-white text-black font-medium outline-none"
            />

            <button
              onClick={upload}
              disabled={!file || !location || !caption.trim() || loading}
              className="w-full py-4 rounded-3xl bg-white text-black font-bold disabled:opacity-40"
            >
              {loading ? "Uploading..." : "Share"}
            </button>

            <div className="text-center text-sm text-purple-100 pt-2">
              {status}
            </div>

          </div>
        </>
      )}

      <div className="w-full max-w-5xl mt-12">

        <div className="text-white text-center mb-4">
          <h2 className="text-2xl font-bold">
            Campus Map
          </h2>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-4">
          <PhotoMap photos={photos} />
        </div>

      </div>

    </div>
  );
}