
const KPH_PER_MPH = 1.609344

// convert Celsius to Farenheit
export function celsiusToFarenheit(c: number | null): number | null {
  if (c) return c * 9 / 5 + 32
  return null
}

// convert km/h to mph
export function khmToMph(kph: number | null): number | null {
  if (kph) return kph /  KPH_PER_MPH
  return null
}


export function windSpeedToBeaufort(wsKph: number | null ): number | null {
  if (!wsKph) { return null}

  if (wsKph <= 1) {
    return 0; // Calm
  } else if (wsKph <= 5) {
    return 1; // Light air
  } else if (wsKph <= 11) {
    return 2; // Light breeze
  } else if (wsKph <= 19) {
    return 3; // Gentle breeze
  } else if (wsKph <= 28) {
    return 4; // Moderate breeze
  } else if (wsKph <= 38) {
    return 5; // Fresh breeze
  } else if (wsKph <= 49) {
    return 6; // Strong breeze
  } else if (wsKph <= 61) {
    return 7; // Near gale
  } else if (wsKph <= 74) {
    return 8; // Fresh gale
  } else if (wsKph <= 88) {
    return 9; // Strong gale
  } else if (wsKph <= 102) {
    return 10; // Whole gale / Storm
  } else if (wsKph <= 117) {
    return 11; // Violent storm
  } else {
    return 12; // Hurricane force
  }
}
