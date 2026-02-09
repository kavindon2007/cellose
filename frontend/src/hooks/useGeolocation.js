import { useState, useEffect } from 'react';

const useGeolocation = () => {
    const [location, setLocation] = useState({
        loaded: false,
        coordinates: { lat: "", lng: "" }
    });
    const [error, setError] = useState(null);

    const onSuccess = (location) => {
        setLocation({
            loaded: true,
            coordinates: {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            },
        });
    };

    const onError = (error) => {
        setLocation({
            loaded: true,
            error: {
                code: error.code,
                message: error.message,
            },
        });
        setError(error.message);
    };

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            onError({
                code: 0,
                message: "Geolocation not supported",
            });
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }, []);

    return { location, error };
};

export default useGeolocation;
