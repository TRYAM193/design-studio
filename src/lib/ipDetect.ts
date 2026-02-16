export const getRegionFromIP = async () => {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const region = data.country_code;
        if (['IN', 'US', 'CA', 'GB'].includes(region)) {
            return region;
        } else {
            return "GB"; // Default to GB if region is not in our list
        }
    } catch (error) {
        console.error("Error fetching region from IP:", error);
        return "GB"; // Default to GB if error occurs
    }
};