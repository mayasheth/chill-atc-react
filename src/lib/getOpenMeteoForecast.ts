import { fetchWeatherApi } from "openmeteo";

export type WeatherNow = {
  time: Date;
  isDay: boolean;
  weatherCode: number;
  tempC: number;
  apparentTempC: number;
  cloudCoverPct: number;
  
  windSpeedKph: number;
  windDirDeg: number;
  windGustKph: number;

  precipitationMm: number,
  rainMm: number,
  showersMm: number,
  snowfallCm: number
};

export type WeatherHourly = {
  time: Date[];
  tempC: number[];
  precipitationMm: number[];
};

export type WeatherDaily = {
  time: Date[];
  code: number[];
  tMaxC: number[];
  tMinC: number[];
};

export type WeatherForecast = {
  now: WeatherNow;
  hourly: WeatherHourly;
  daily: WeatherDaily;
  timezone: string;
  lat: number;
  lon: number;
};


const range = (start: number, stop: number, step: number) =>
  Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);



/** Minimal forecast for one location */
export async function getForecast(latitude: number, longitude: number): Promise<WeatherForecast> {
  const url = "https://api.open-meteo.com/v1/forecast";

  // IMPORTANT: order of variables in the query must match how we index them below
  const params = {
    latitude: [latitude],
    longitude: [longitude],
    timezone: "GMT",
    models: "best_match",
	  daily: ["sunset", "sunrise"],
	  current: ["is_day", "weather_code", "temperature_2m", "apparent_temperature",  "cloud_cover",
      "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
      "precipitation", "rain", "showers", "snowfall"],
  };

  const [resp] = await fetchWeatherApi(url, params);
  const utcOffset = resp.utcOffsetSeconds();
  const daily = resp.daily()!;
  const current = resp.current()!;

  const dailyTime = range(Number(daily.time()), Number(daily.timeEnd()), daily.interval())
    .map((t) => new Date((t + utcOffset) * 1000));

  const dailyConditions: WeatherDaily = {
    time: dailyTime,
    sunset: 

  }


  const currentConditions: WeatherNow = {
    time: new Date((Number(current.time()) + utcOffset) * 1000),

    isDay: Boolean(current.variables(0)!.value()),
    weatherCode: current.variables(1)!.value(),
    tempC: current.variables(2)!.value(),
    apparentTempC: current.variables(3)!.value(),
    cloudCoverPct: current.variables(4)!.value(),
   
    windSpeedKph: current.variables(5)!.value(),
    windDirDeg: current.variables(6)!.value(),
    windGustKpm: current.variables(7)!.value(),

    precipitationMm: current.variables(8)!.value(),
    rainMm: current.variables(9)!.value(),
    showersMm: current.variables(10)!.value(),
    snowfallCm: current.variables(11)!.value(),
  };

  

  return {
    now,
    hourly: {
      time: hourlyTime,
      tempC: hourly.variables(0)!.valuesArray()!,
      precipitationMm: hourly.variables(1)!.valuesArray()!,
    },
    daily: {
      time: dailyTime,
      code: daily.variables(0)!.valuesArray()!,
      tMaxC: daily.variables(1)!.valuesArray()!,
      tMinC: daily.variables(2)!.valuesArray()!,
    },
    timezone: resp.timezone(),
    latitude: resp.latitude(),
    longitude: resp.longitude(),
  };
}


#############

const params = {
	"latitude": 52.52,
	"longitude": 13.41,
	"daily": ["sunset", "sunrise"],
	"models": "best_match",
	"current": ["temperature_2m", "is_day", "apparent_temperature", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "rain", "showers", "snowfall", "cloud_cover", "weather_code"],
};
const url = "https://api.open-meteo.com/v1/forecast";
const responses = await fetchWeatherApi(url, params);

// Process first location. Add a for-loop for multiple locations or weather models
const response = responses[0];

// Attributes for timezone and location
const latitude = response.latitude();
const longitude = response.longitude();
const elevation = response.elevation();
const utcOffsetSeconds = response.utcOffsetSeconds();

console.log(
	`\nCoordinates: ${latitude}°N ${longitude}°E`,
	`\nElevation: ${elevation}m asl`,
	`\nTimezone difference to GMT+0: ${utcOffsetSeconds}s`,
);

const current = response.current()!;
const daily = response.daily()!;

// Define Int64 variables so they can be processed accordingly
const sunset = daily.variables(0)!;
const sunrise = daily.variables(1)!;

// Note: The order of weather variables in the URL query and the indices below need to match!
const weatherData = {
	current: {
		time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
		temperature_2m: current.variables(0)!.value(),
		is_day: current.variables(1)!.value(),
		apparent_temperature: current.variables(2)!.value(),
		wind_speed_10m: current.variables(3)!.value(),
		wind_direction_10m: current.variables(4)!.value(),
		wind_gusts_10m: current.variables(5)!.value(),
		rain: current.variables(6)!.value(),
		showers: current.variables(7)!.value(),
		snowfall: current.variables(8)!.value(),
		cloud_cover: current.variables(9)!.value(),
		weather_code: current.variables(10)!.value(),
	},
	daily: {
		time: [...Array((Number(daily.timeEnd()) - Number(daily.time())) / daily.interval())].map(
			(_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
		),
		// Map Int64 values to according structure
		sunset: [...Array(sunset.valuesInt64Length())].map(
			(_, i) => new Date((Number(sunset.valuesInt64(i)) + utcOffsetSeconds) * 1000)
		),
		// Map Int64 values to according structure
		sunrise: [...Array(sunrise.valuesInt64Length())].map(
			(_, i) => new Date((Number(sunrise.valuesInt64(i)) + utcOffsetSeconds) * 1000)
		),
	},
};

// 'weatherData' now contains a simple structure with arrays with datetime and weather data
console.log(
	`\nCurrent time: ${weatherData.current.time}`,
	`\nCurrent temperature_2m: ${weatherData.current.temperature_2m}`,
	`\nCurrent is_day: ${weatherData.current.is_day}`,
	`\nCurrent apparent_temperature: ${weatherData.current.apparent_temperature}`,
	`\nCurrent wind_speed_10m: ${weatherData.current.wind_speed_10m}`,
	`\nCurrent wind_direction_10m: ${weatherData.current.wind_direction_10m}`,
	`\nCurrent wind_gusts_10m: ${weatherData.current.wind_gusts_10m}`,
	`\nCurrent rain: ${weatherData.current.rain}`,
	`\nCurrent showers: ${weatherData.current.showers}`,
	`\nCurrent snowfall: ${weatherData.current.snowfall}`,
	`\nCurrent cloud_cover: ${weatherData.current.cloud_cover}`,
	`\nCurrent weather_code: ${weatherData.current.weather_code}`,
);
console.log("\nDaily data", weatherData.daily)