import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const reportEmergency = async (formData) => {
    try {
        const response = await axios.post(`${API_URL}/report/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error reporting emergency:", error);
        throw error;
    }
};

export const getIncidents = async () => {
    try {
        const response = await axios.get(`${API_URL}/incidents/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching incidents:", error);
        throw error;
    }
};

export const updateStatus = async (id, status) => {
    try {
        const response = await axios.patch(`${API_URL}/incidents/${id}/status`, null, {
            params: { new_status: status }
        });
        return response.data;
    } catch (error) {
        console.error("Error updating status:", error);
        throw error;
    }
};

export const getSMSLink = async (lat, lng, type) => {
    try {
        const response = await axios.post(`${API_URL}/sms-fallback/`, null, {
            params: { latitude: lat, longitude: lng, type }
        });
        return response.data;
    } catch (error) {
        console.error("Error getting SMS link:", error);
        throw error;
    }
}
