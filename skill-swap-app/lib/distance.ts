export function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);

  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.asin(Math.min(1, Math.sqrt(s1 + s2)));
  return R * c;
}
