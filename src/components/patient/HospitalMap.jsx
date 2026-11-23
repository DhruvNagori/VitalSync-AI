
import { useEffect } from "react";

import L from "leaflet";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";


L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});


function MapController({ selectedHospital, center }) {

  const map = useMap();

  useEffect(() => {

    if (selectedHospital) {

      map.flyTo(
        [
          selectedHospital.latitude,
          selectedHospital.longitude
        ],
        16,
        {
          duration: 1
        }
      );

    } else if (center) {

      map.flyTo(center, 13);

    }

  }, [selectedHospital, center, map]);

  return null;
}


function HospitalMap({
  center,
  hospitals,
  selectedHospital,
  onHospitalSelect
}) {

  return (

    <div className="hospital-map-wrapper">

      <MapContainer
        center={center}
        zoom={center[0] === 22.9734 ? 5 : 13}
        scrollWheelZoom={true}
        className="hospital-map"
      >

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          selectedHospital={selectedHospital}
          center={center}
        />

        {hospitals.map((hospital) => (

          <Marker
            key={hospital.id}
            position={[
              hospital.latitude,
              hospital.longitude
            ]}
            eventHandlers={{
              click: () => onHospitalSelect(hospital)
            }}
          >

            <Popup>

              <div className="hospital-map-popup">

                <strong>{hospital.name}</strong>

                <p>{hospital.category}</p>

                <p>{hospital.address}</p>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get Directions
                </a>

              </div>

            </Popup>

          </Marker>

        ))}

      </MapContainer>

    </div>

  );
}

export default HospitalMap;
