const form = document.querySelector("#searchForm");
const cityInput = document.querySelector("#cityInput");
const statusText = document.querySelector("#status");
const locationButton = document.querySelector("#locationButton");
const weatherCard = document.querySelector("#weatherCard");
const metrics = document.querySelector("#metrics");
const forecastSection = document.querySelector("#forecastSection");
const forecastGrid = document.querySelector("#forecastGrid");
const weatherVisual = document.querySelector("#weatherVisual");

const elements = {
  placeName: document.querySelector("#placeName"),
  conditionText: document.querySelector("#conditionText"),
  updatedAt: document.querySelector("#updatedAt"),
  temperature: document.querySelector("#temperature"),
  feelsLike: document.querySelector("#feelsLike"),
  windSpeed: document.querySelector("#windSpeed"),
  humidity: document.querySelector("#humidity"),
  pressure: document.querySelector("#pressure"),
  timezoneLabel: document.querySelector("#timezoneLabel"),
};

const weatherCodes = {
  0: ["Clear sky", "clear"],
  1: ["Mainly clear", "clear"],
  2: ["Partly cloudy", "cloudy"],
  3: ["Overcast", "cloudy"],
  45: ["Fog", "foggy"],
  48: ["Depositing rime fog", "foggy"],
  51: ["Light drizzle", "rainy"],
  53: ["Drizzle", "rainy"],
  55: ["Dense drizzle", "rainy"],
  56: ["Freezing drizzle", "rainy"],
  57: ["Freezing drizzle", "rainy"],
  61: ["Slight rain", "rainy"],
  63: ["Rain", "rainy"],
  65: ["Heavy rain", "rainy"],
  66: ["Freezing rain", "rainy"],
  67: ["Freezing rain", "rainy"],
  71: ["Slight snow", "snowy"],
  73: ["Snow", "snowy"],
  75: ["Heavy snow", "snowy"],
  77: ["Snow grains", "snowy"],
  80: ["Rain showers", "rainy"],
  81: ["Rain showers", "rainy"],
  82: ["Violent showers", "rainy"],
  85: ["Snow showers", "snowy"],
  86: ["Heavy snow showers", "snowy"],
  95: ["Thunderstorm", "stormy"],
  96: ["Thunderstorm with hail", "stormy"],
  99: ["Thunderstorm with hail", "stormy"],
};

const setStatus = (message, isError = false) => {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
};

const getWeatherInfo = (code) => weatherCodes[code] || ["Weather unavailable", "cloudy"];

const formatDateTime = (isoDate, timezone) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(isoDate));

const formatDay = (isoDate) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${isoDate}T12:00:00`));

const fetchJson = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("The weather service is not responding right now.");
  }

  return response.json();
};

const searchCity = async (query) => {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name: query,
    count: "1",
    language: "en",
    format: "json",
  });

  const data = await fetchJson(url);

  if (!data.results?.length) {
    throw new Error("No matching city found. Try a larger nearby city.");
  }

  return data.results[0];
};

const fetchWeather = async ({ latitude, longitude }) => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "7",
  });

  return fetchJson(url);
};

const revealWeather = () => {
  weatherCard.hidden = false;
  metrics.hidden = false;
  forecastSection.hidden = false;
};

const renderForecast = (daily) => {
  forecastGrid.innerHTML = daily.time
    .map((date, index) => {
      const [, type] = getWeatherInfo(daily.weather_code[index]);
      const high = Math.round(daily.temperature_2m_max[index]);
      const low = Math.round(daily.temperature_2m_min[index]);
      const rain = daily.precipitation_probability_max[index] ?? 0;

      return `
        <article class="forecast-card ${type}">
          <div class="forecast-icon" aria-hidden="true"></div>
          <strong>${formatDay(date)}</strong>
          <span>${high}° / ${low}° · ${rain}%</span>
        </article>
      `;
    })
    .join("");
};

const renderWeather = (place, data) => {
  const current = data.current;
  const [condition, type] = getWeatherInfo(current.weather_code);
  const locationParts = [place.name, place.admin1, place.country].filter(Boolean);
  const visualClass = current.is_day ? type : `${type} night`;

  elements.placeName.textContent = locationParts.join(", ");
  elements.conditionText.textContent = condition;
  elements.updatedAt.textContent = `Updated ${formatDateTime(current.time, data.timezone)}`;
  elements.temperature.textContent = Math.round(current.temperature_2m);
  elements.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°`;
  elements.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  elements.humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  elements.pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
  elements.timezoneLabel.textContent = data.timezone_abbreviation || data.timezone;

  weatherVisual.className = `weather-orbit ${visualClass}`;
  renderForecast(data.daily);
  revealWeather();
};

const loadWeather = async (place) => {
  setStatus("Loading fresh forecast...");
  const data = await fetchWeather(place);
  renderWeather(place, data);
  setStatus("Forecast loaded.");
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();

  if (!query) {
    setStatus("Enter a city name to search.", true);
    cityInput.focus();
    return;
  }

  try {
    setStatus("Finding location...");
    const place = await searchCity(query);
    await loadWeather(place);
  } catch (error) {
    setStatus(error.message, true);
  }
});

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Your browser does not support location lookup.", true);
    return;
  }

  setStatus("Requesting your location...");
  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        await loadWeather({
          name: "Current location",
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      } catch (error) {
        setStatus(error.message, true);
      }
    },
    () => setStatus("Location permission was blocked or unavailable.", true),
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

searchCity("New Delhi")
  .then(loadWeather)
  .catch(() => setStatus("Search for a city to see the current forecast."));
