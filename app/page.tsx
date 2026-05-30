"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Location = {
  lat: number;
  lng: number;
};

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);

  function getLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  async function handleAddLocation() {
    setStatus("Finding your spot...");
    try {
      const loc = await getLocation();
      setLocation(loc);
      setStatus("Location locked in ✔");
    } catch {
      setStatus("Could not get location");
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

    const { error: dbError } = await supabase.from("photos").insert({
      image_url: imageUrl,
      lat: location.lat,
      lng: location.lng,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      setStatus(dbError.message);
      setLoading(false);
      return;
    }

    setStatus("Posted ✔");
    setPosted(true);
    setLoading(false);
  }

  function reset() {
    setFile(null);
    setLocation(null);
    setStatus("");
    setPosted(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-indigo-100 to-pink-100 flex flex-col items-center px-5 py-8">

      {/* Header */}
      <div className="w-full max-w-md text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-900">
          HELP ME MAP CAMPUS
        </h1>
        <p className="text-sm text-indigo-700 mt-1">
          Snap a moment. Drop it on the map.
        </p>
      </div>

      {/* Success state */}
      {posted ? (
        <div className="w-full max-w-md flex flex-col items-center space-y-4">

          <div className="w-full aspect-[3/4] rounded-3xl overflow-hidden border border-white/50 bg-white shadow-xl flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-2xl">✔</div>
              <div className="text-indigo-900 font-medium">
                Posted to campus map
              </div>
              <div className="text-sm text-indigo-600">
                Your photo is now live
              </div>
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-medium shadow-md active:scale-[0.98] transition"
          >
            Submit another?
          </button>
        </div>
      ) : (
        <>
          {/* Preview */}
          <div className="w-full max-w-md mb-6">
            <div className="aspect-[3/4] rounded-3xl border border-white/60 bg-white shadow-xl overflow-hidden flex items-center justify-center">
              {file ? (
                <img
                  src={URL.createObjectURL(file)}
                  className="w-full h-full object-cover"
                  alt="preview"
                />
              ) : (
                <div className="text-indigo-400 text-sm">
                  No photo yet
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="w-full max-w-md mb-3 text-center">
            {location ? (
              <div className="text-xs text-green-700 font-medium">
                📍 Locked in
              </div>
            ) : (
              <div className="text-xs text-indigo-500">
                No location yet
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="w-full max-w-md space-y-3">

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
              id="camera"
            />

            <label
              htmlFor="camera"
              className="block w-full text-center py-3 rounded-2xl bg-white text-indigo-900 font-medium shadow-md"
            >
              Take Photo
            </label>

            <button
              onClick={handleAddLocation}
              className="w-full py-3 rounded-2xl bg-indigo-200 text-indigo-900 font-medium shadow-sm"
            >
              Add Location
            </button>

            <button
              onClick={upload}
              disabled={!file || !location || loading}
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-medium disabled:opacity-40 shadow-md"
            >
              {loading ? "Posting..." : "Upload to Map"}
            </button>

            <p className="text-center text-xs text-indigo-600">
              {status}
            </p>
          </div>
        </>
      )}
    </div>
  );
}