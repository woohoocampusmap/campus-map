"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type Photo = {
  id: number;
  image_url: string;
  lat: number;
  lng: number;
  caption: string;
  created_at: string;
};

const photoIcon = (url: string) =>
  L.divIcon({
    html: `
      <div
        style="
          width:48px;
          height:48px;
          border-radius:999px;
          overflow:hidden;
          border:3px solid white;
          box-shadow:0 2px 10px rgba(0,0,0,.35);
        "
      >
        <img
          src="${url}"
          style="
            width:100%;
            height:100%;
            object-fit:cover;
          "
        />
      </div>
    `,
    className: "",
    iconSize: [48, 48],
  });

export default function PhotoMap({
  photos,
}: {
  photos: Photo[];
}) {
  return (
    <MapContainer
      center={[42.055, -87.675]}
      zoom={15}
      scrollWheelZoom={true}
      className="h-[600px] w-full rounded-3xl"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {photos.map((photo) => (
        <Marker
          key={photo.id}
          position={[photo.lat, photo.lng]}
          icon={photoIcon(photo.image_url)}
        >
          <Popup>
            <div className="w-56">
              <img
                src={photo.image_url}
                alt=""
                className="rounded-lg w-full"
              />

              <div className="mt-3 font-semibold">
                {photo.caption}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {new Date(photo.created_at).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}