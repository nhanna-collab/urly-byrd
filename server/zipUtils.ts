import zipcodes from 'zipcodes';

export function getDistance(zip1: string, zip2: string): number | null {
  const loc1 = zipcodes.lookup(zip1);
  const loc2 = zipcodes.lookup(zip2);

  if (!loc1 || !loc2) {
    return null;
  }

  const lat1 = typeof loc1.latitude === 'string' ? parseFloat(loc1.latitude) : loc1.latitude;
  const lon1 = typeof loc1.longitude === 'string' ? parseFloat(loc1.longitude) : loc1.longitude;
  const lat2 = typeof loc2.latitude === 'string' ? parseFloat(loc2.latitude) : loc2.latitude;
  const lon2 = typeof loc2.longitude === 'string' ? parseFloat(loc2.longitude) : loc2.longitude;

  return haversineDistance(lat1, lon1, lat2, lon2);
}

export function isWithinRadius(
  customerZip: string,
  merchantZip: string,
  radiusMiles: number
): boolean {
  const distance = getDistance(customerZip, merchantZip);
  if (distance === null) {
    return false;
  }
  return distance <= radiusMiles;
}

function haversineDistance(
  lat1: number | string,
  lon1: number | string,
  lat2: number | string,
  lon2: number | string
): number {
  const lat1Num = typeof lat1 === 'string' ? parseFloat(lat1) : lat1;
  const lon1Num = typeof lon1 === 'string' ? parseFloat(lon1) : lon1;
  const lat2Num = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
  const lon2Num = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2Num - lat1Num);
  const dLon = toRadians(lon2Num - lon1Num);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1Num)) *
      Math.cos(toRadians(lat2Num)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function validateZipCode(zipCode: string): boolean {
  const lookup = zipcodes.lookup(zipCode);
  return lookup !== undefined;
}

export function findClosestZip(lat: number, lon: number): string | null {
  const seedZips = [
    '10001', '90210', '60601', '77001', '30301', '85001', '98101', '02101', '80201', '33101',
    '19101', '48201', '63101', '55401', '94102', '92101', '97201', '89101', '32801', '37201',
    '53201', '67201', '68101', '73101', '87101', '84101', '99501', '96801', '71601', '39201',
    '36101', '70112', '40201', '38101', '43201', '45201', '46201', '15201', '44101', '14201',
    '80202', '20001', '21201', '23451', '28201', '27601', '29401', '33602', '64101', '78201',
    '79901', '76101', '75201', '88001', '85201', '91101', '93101', '95814', '97401', '99201',
    '59601', '82001', '58501', '57001', '04330', '82901', '59701', '83702', '59101', '82601',
    '79101', '69101', '04101', '05701'
  ];
  
  let closestZip: string | null = null;
  let minDistance = Infinity;
  
  for (const testZip of seedZips) {
    const zipInfo = zipcodes.lookup(testZip);
    if (!zipInfo) continue;
    
    const nearby = zipcodes.radius(testZip, 150);
    if (!Array.isArray(nearby)) continue;
    
    for (const nearZip of nearby) {
      const zipStr = typeof nearZip === 'string' ? nearZip : nearZip.zip;
      const nearZipInfo = zipcodes.lookup(zipStr);
      if (!nearZipInfo) continue;
      
      const distance = haversineDistance(
        lat,
        lon,
        nearZipInfo.latitude,
        nearZipInfo.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestZip = zipStr;
      }
    }
    
    if (closestZip && minDistance < 10) break;
  }
  
  return closestZip;
}
