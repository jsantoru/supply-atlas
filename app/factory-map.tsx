import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Entity } from './types';
import { Empty } from './controls';
export default function FactoryMap({
  facilities,
  onSelect,
}: {
  facilities: Entity[];
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const callback = useRef(onSelect);
  callback.current = onSelect;
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView(
      [51.5, -3.5],
      5,
    );
    const tiles = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ).addTo(map);
    tiles.on('tileerror', () => setFailed(true));
    const markers = L.layerGroup().addTo(map);
    const draw = () => {
      markers.clearLayers();
      const groups = new Map<string, Entity[]>();
      for (const f of facilities) {
        if (f.latitude === null || f.longitude === null) continue;
        const point = map.project([f.latitude, f.longitude]);
        const key = `${Math.floor(point.x / 50)},${Math.floor(point.y / 50)}`;
        groups.set(key, [...(groups.get(key) || []), f]);
      }
      groups.forEach((group) => {
        const f = group[0];
        const icon = L.divIcon({
          className: 'atlas-marker',
          html: `<span>${group.length > 1 ? group.length : '●'}</span>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        const marker = L.marker([f.latitude!, f.longitude!], {
          icon,
          title:
            group.length > 1
              ? `${group.length} facilities — zoom to expand`
              : f.name,
          keyboard: true,
        }).addTo(markers);
        marker.on('click', () =>
          group.length > 1
            ? map.setView([f.latitude!, f.longitude!], map.getZoom() + 2)
            : callback.current(f.id),
        );
      });
    };
    map.on('zoomend', draw);
    draw();
    if (facilities.length) {
      const located = facilities.filter(
        (f) => f.latitude !== null && f.longitude !== null,
      );
      if (located.length)
        map.fitBounds(
          L.latLngBounds(
            located.map((f) => [f.latitude!, f.longitude!] as [number, number]),
          ),
          { maxZoom: 7, padding: [60, 60] },
        );
    }
    return () => {
      map.remove();
    };
  }, [facilities]);
  return (
    <>
      <div
        ref={ref}
        className="factory-map"
        aria-label="Facility location map"
      />
      {failed && (
        <p role="status" className="notice">
          Map tiles are unavailable. Facility names and coordinates remain
          available below.
        </p>
      )}
      <div className="map-list">
        {facilities.length ? (
          facilities.map((f) => (
            <button key={f.id} onClick={() => onSelect(f.id)}>
              <strong>{f.name}</strong>
              <span>
                {f.precision} location · {f.latitude}, {f.longitude}
              </span>
            </button>
          ))
        ) : (
          <Empty
            title="No supported factory location"
            text="The selected filters have no documented facility. Supplier headquarters are not used as factory locations."
          />
        )}
      </div>
      <p className="footnote">
        Approximate pins indicate town-level locations. Nearby facilities
        cluster as you zoom out. No chip fabrication site is established in this
        collection.
      </p>
    </>
  );
}
