/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get user's current position
 * Returns { latitude, longitude } or null if permission denied
 */
export function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve(null);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

/**
 * Check if user is within specified distance of any gym
 * Returns { isWithinRange: boolean, nearestGymDistance: number, nearestGym: gym object | null }
 */
export function checkDistanceToGyms(userLat, userLon, gyms, distanceThreshold = 200) {
  if (!gyms || gyms.length === 0) {
    return { isWithinRange: false, nearestGymDistance: null, nearestGym: null };
  }

  let nearestDistance = Infinity;
  let nearestGym = null;

  gyms.forEach((gym) => {
    if (gym.latitude && gym.longitude) {
      const distance = calculateDistance(userLat, userLon, gym.latitude, gym.longitude);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestGym = gym;
      }
    }
  });

  return {
    isWithinRange: nearestDistance <= distanceThreshold,
    nearestGymDistance: nearestDistance === Infinity ? null : Math.round(nearestDistance),
    nearestGym: nearestGym,
  };
}