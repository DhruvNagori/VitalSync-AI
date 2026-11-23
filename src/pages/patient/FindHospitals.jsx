
import { useMemo, useState } from "react";

import {
    MapPin,
    Phone,
    Search,
    Navigation,
    LocateFixed,
    Hospital,
    Building2,
    SlidersHorizontal,
    AlertCircle,
    ExternalLink,
    LoaderCircle
} from "lucide-react";

import HospitalMap from "../../components/patient/HospitalMap";

import {
    searchLocation,
    findNearbyHospitals,
    calculateDistance
} from "../../services/hospitalService";

import {
    PageHeader,
    SectionHeading,
    Panel,
    DemoNotice
} from "../../components/patient/PageComponents";


const INDIA_CENTER = [22.9734, 78.6569];


function FindHospitals() {

    const [location, setLocation] = useState("");

    const [center, setCenter] = useState(INDIA_CENTER);

    const [locationLabel, setLocationLabel] = useState(
        "Search a location or use your current location."
    );

    const [searchedCoordinates, setSearchedCoordinates] = useState(null);

    const [hospitals, setHospitals] = useState([]);

    const [selectedHospital, setSelectedHospital] = useState(null);

    const [searchText, setSearchText] = useState("");

    const [facilityType, setFacilityType] = useState("all");

    const [radius, setRadius] = useState("5000");

    const [emergencyOnly, setEmergencyOnly] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [searched, setSearched] = useState(false);


    async function loadHospitals(
        latitude,
        longitude,
        label,
        searchRadius = Number(radius),
        selectedFacilityType = facilityType
    ) {

        setLoading(true);
        setError("");
        setHospitals([]);
        setSelectedHospital(null);

        try {

            const results = await findNearbyHospitals(
                latitude,
                longitude,
                searchRadius,
                selectedFacilityType
            );

            const resultsWithDistance = results.map((hospital) => {

                const distance = calculateDistance(
                    latitude,
                    longitude,
                    hospital.latitude,
                    hospital.longitude
                );

                return {
                    ...hospital,
                    distance
                };

            });

            resultsWithDistance.sort(
                (a, b) => a.distance - b.distance
            );

            setHospitals(resultsWithDistance);

            setCenter([latitude, longitude]);

            setSearchedCoordinates({
                latitude,
                longitude,
                label
            });

            setLocationLabel(label);

            setSearched(true);

            if (resultsWithDistance.length === 0) {
                setError(
                    "No mapped healthcare facilities found in this area. Try increasing the search radius."
                );
            }

        } catch (err) {

            setError(
                err.message || "Unable to load healthcare facilities."
            );

        } finally {

            setLoading(false);

        }

    }


    async function handleSearch(e) {

        e.preventDefault();

        if (!location.trim()) {
            setError("Please enter a city or location.");
            return;
        }

        setLoading(true);
        setError("");

        try {

            const result = await searchLocation(location.trim());

            await loadHospitals(
                result.latitude,
                result.longitude,
                result.displayName
            );

        } catch (err) {

            setError(err.message);

            setLoading(false);

        }

    }


    function handleCurrentLocation() {

        setError("");

        if (!navigator.geolocation) {

            setError(
                "Your browser does not support location services."
            );

            return;

        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(

            async (position) => {

                const latitude = position.coords.latitude;

                const longitude = position.coords.longitude;

                await loadHospitals(
                    latitude,
                    longitude,
                    "Your current location"
                );

            },

            (err) => {

                setLoading(false);

                if (err.code === 1) {
                    setError("Please allow location permission in your browser.");
                } else if (err.code === 3) {
                    setError("Location request timed out. Please try again.");
                } else {
                    setError("Unable to retrieve your current location.");
                }

            },

            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 60000
            }

        );

    }


    const filteredHospitals = useMemo(() => {

        return hospitals.filter((hospital) => {

            const normalizedSearch = searchText.trim().toLowerCase();

            const matchesText =
                !normalizedSearch ||
                String(hospital.name || "").toLowerCase().includes(normalizedSearch) ||
                String(hospital.specialty || "").toLowerCase().includes(normalizedSearch) ||
                String(hospital.category || "").toLowerCase().includes(normalizedSearch) ||
                String(hospital.address || "").toLowerCase().includes(normalizedSearch);

            const matchesType =
                facilityType === "all" ||
                hospital.category === facilityType ||
                (
                    // Geoapify classifies doctor practices under
                    // healthcare.clinic_or_praxis, not a separate "doctor" category.
                    facilityType === "doctors" &&
                    hospital.category === "clinic"
                );

            const matchesEmergency =
                !emergencyOnly || hospital.emergency;

            return (
                matchesText &&
                matchesType &&
                matchesEmergency
            );

        });

    }, [
        hospitals,
        searchText,
        facilityType,
        emergencyOnly
    ]);


    function openDirections(hospital) {

        const url =
            `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

        window.open(url, "_blank", "noopener,noreferrer");

    }


    function getFacilityLabel(category) {

        const labels = {
            hospital: "Hospital",
            clinic: "Clinic / Doctor Practice",
            doctors: "Clinic / Doctor Practice",
            doctor: "Clinic / Doctor Practice"
        };

        return labels[category] || "Healthcare Facility";

    }


    return (

        <div className="patient-feature-page">

            <PageHeader
                eyebrow="HEALTHCARE DISCOVERY"
                title="Find Hospitals"
                description="Discover healthcare facilities, explore nearby hospitals and view their locations on an interactive map."
            />

            <DemoNotice />

            {/* Search */}

            <section className="feature-section">

                <SectionHeading
                    title="Find Healthcare Near You"
                    description="Enter a city, area or landmark to discover nearby healthcare facilities."
                />

                <Panel>

                    <form
                        className="hospital-search-form"
                        onSubmit={handleSearch}
                    >

                        <div className="hospital-search">

                            <MapPin size={21} />

                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Enter city or location..."
                                aria-label="Search location"
                            />

                            <button
                                type="submit"
                                className="hospital-search-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <LoaderCircle size={17} className="spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search size={17} />
                                        Search
                                    </>
                                )}
                            </button>

                        </div>

                        <button
                            type="button"
                            className="feature-secondary-button"
                            onClick={handleCurrentLocation}
                            disabled={loading}
                        >
                            <LocateFixed size={17} />
                            Use My Current Location
                        </button>

                    </form>


                    <div className="hospital-filter-row">


                        <div className="hospital-filter-item">

                            <label>Search Radius</label>

                            <select
                                value={radius}
                                onChange={async (e) => {

                                    const newRadius = e.target.value;

                                    setRadius(newRadius);

                                    if (searchedCoordinates) {

                                        await loadHospitals(
                                            searchedCoordinates.latitude,
                                            searchedCoordinates.longitude,
                                            searchedCoordinates.label,
                                            Number(newRadius)
                                        );

                                    }

                                }}
                            >

                                <option value="3000">3 km</option>
                                <option value="5000">5 km</option>
                                <option value="10000">10 km</option>
                                <option value="20000">20 km</option>

                            </select>

                        </div>



                        <div className="hospital-filter-item">

                            <label>Facility Type</label>

                            <select
                                value={facilityType}
                                onChange={async (e) => {

                                    const newType = e.target.value;

                                    setFacilityType(newType);

                                    if (searchedCoordinates) {

                                        await loadHospitals(
                                            searchedCoordinates.latitude,
                                            searchedCoordinates.longitude,
                                            searchedCoordinates.label,
                                            Number(radius),
                                            newType
                                        );

                                    }

                                }}
                            >

                                <option value="all">All Facilities</option>
                                <option value="hospital">Hospitals</option>
                                <option value="clinic">Clinics</option>
                                <option value="doctors">Doctor / Clinic Practices</option>

                            </select>

                        </div>


                        <label className="hospital-emergency-filter">

                            <input
                                type="checkbox"
                                checked={emergencyOnly}
                                onChange={(e) =>
                                    setEmergencyOnly(e.target.checked)
                                }
                            />

                            Emergency facilities only

                        </label>

                    </div>

                    {error && (

                        <div className="hospital-error">

                            <AlertCircle size={18} />

                            <span>{error}</span>

                        </div>

                    )}

                </Panel>

            </section>


            {/* Map and Results */}

            <section className="feature-section">

                <SectionHeading
                    title="Nearby Healthcare Facilities"
                    description={locationLabel}
                />

                <div className="hospital-results-summary">

                    <div>
                        <Hospital size={20} />
                        <strong>{filteredHospitals.length}</strong>
                        <span>Facilities found</span>
                    </div>

                    {loading && (
                        <span className="hospital-loading">
                            <LoaderCircle size={17} />
                            Searching...
                        </span>
                    )}

                </div>


                <div className="hospital-discovery-layout">

                    {/* Results List */}

                    <div className="hospital-results-panel">


                        <div className="hospital-results-heading">

                            <div>
                                <h3>Search Results</h3>
                                <p>Find a hospital by name or specialty</p>
                            </div>

                            <SlidersHorizontal size={19} />

                        </div>

                        <div className="hospital-name-search">

                            <Search size={17} />

                            <input
                                type="text"
                                placeholder="Search hospital name or specialty..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                aria-label="Search hospitals by name or specialty"
                            />

                        </div>



                        {!searched && !loading && (

                            <div className="hospital-initial-state">

                                <MapPin size={32} />

                                <h3>Search for hospitals</h3>

                                <p>
                                    Search for a location to display nearby
                                    healthcare facilities.
                                </p>

                            </div>

                        )}


                        {loading && (

                            <div className="hospital-initial-state">

                                <LoaderCircle size={32} />

                                <h3>Finding facilities...</h3>

                                <p>
                                    Retrieving nearby facilities from Geoapify.
                                </p>

                            </div>

                        )}


                        {searched && !loading && filteredHospitals.length === 0 && (

                            <div className="hospital-initial-state">

                                <Building2 size={32} />

                                <h3>No matching facilities</h3>

                                <p>
                                    Try changing the filters or increasing the search radius.
                                </p>

                            </div>

                        )}


                        {!loading && filteredHospitals.map((hospital) => (

                            <div
                                className={`hospital-result-card ${selectedHospital?.id === hospital.id
                                    ? "hospital-result-active"
                                    : ""
                                    }`}
                                key={hospital.id}
                                onClick={() => setSelectedHospital(hospital)}
                            >

                                <div className="hospital-card-top">

                                    <div className="hospital-card-icon">
                                        <Hospital size={22} />
                                    </div>

                                    <div className="hospital-card-info">

                                        <h3>{hospital.name}</h3>

                                        <span>
                                            {getFacilityLabel(hospital.category)}
                                        </span>

                                    </div>

                                </div>


                                <div className="hospital-card-meta">

                                    <p>
                                        <MapPin size={14} />
                                        {hospital.address}
                                    </p>

                                    <p>
                                        <Navigation size={14} />
                                        {hospital.distance.toFixed(2)} km away
                                    </p>

                                    <p>
                                        <Phone size={14} />
                                        {hospital.phone}
                                    </p>

                                </div>


                                {hospital.specialty !== "Not specified" && (

                                    <div className="hospital-specialty">

                                        {hospital.specialty}

                                    </div>

                                )}


                                {hospital.emergency && (

                                    <span className="hospital-emergency-badge">
                                        Emergency tagged
                                    </span>

                                )}


                                <button
                                    className="hospital-direction-button"
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openDirections(hospital);
                                    }}
                                >

                                    <Navigation size={15} />

                                    Get Directions

                                    <ExternalLink size={14} />

                                </button>

                            </div>

                        ))}

                    </div>


                    {/* Interactive Map */}

                    <div className="hospital-map-panel">

                        <div className="hospital-map-panel-heading">

                            <div>
                                <h3>Interactive Map</h3>
                                <p>Select a marker to explore a facility.</p>
                            </div>

                            <MapPin size={20} />

                        </div>

                        <HospitalMap
                            center={center}
                            hospitals={filteredHospitals}
                            selectedHospital={selectedHospital}
                            onHospitalSelect={setSelectedHospital}
                        />

                        <div className="hospital-map-footer">

                            <span>
                                <MapPin size={14} />
                                Geoapify data · OpenStreetMap map
                            </span>

                            <span>
                                {filteredHospitals.length} visible markers
                            </span>

                        </div>

                    </div>

                </div>

            </section>


            {/* Data Information */}

            <section className="feature-section">

                <Panel>

                    <div className="hospital-data-notice">

                        <strong>Hospital data information</strong>

                        <p>
                            Facility information is retrieved through the Geoapify Places API.
                            The underlying place data may include OpenStreetMap contributions.
                            Some facilities may have incomplete or outdated names,
                            addresses, specialties or contact information.
                            A missing listing does not mean that a hospital
                            does not exist.
                        </p>

                        <p>
                            Always verify hospital services, emergency availability
                            and contact details directly with the healthcare facility.
                            This directory is not an emergency dispatch service.
                        </p>

                    </div>

                </Panel>

            </section>

        </div>

    );

}

export default FindHospitals;
