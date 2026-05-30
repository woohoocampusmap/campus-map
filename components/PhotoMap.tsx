"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Photo = {
  id: number;
  image_url: string;
  lat: number;
  lng: number;
};

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
        >
          <Popup>
            <div className="w-48">
              <img
                src={photo.image_url}
                alt=""
                className="rounded-lg w-full"
              />
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}