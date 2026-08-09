const API_KEY = "b7bc9b6e96ab167c8ade3987e17a8643"; // TODO: replace with your OpenWeather API key

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const locateBtn = document.getElementById("locate-btn");
const errorEl = document.getElementById("error");

const cityEl = document.getElementById("city");
const dateEl = document.getElementById("date");
const iconEl = document.getElementById("icon");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");
const forecastGrid = document.getElementById("forecast-grid");
const sourceCityEl = document.getElementById("source-city");

searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) getWeather(query);
});

locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
    }
    locateBtn.textContent = "…";
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            locateBtn.textContent = "◎";
            const { latitude, longitude } = pos.coords;
            getWeatherByCoords(latitude, longitude);
        },
        (err) => {
            locateBtn.textContent = "◎";
            showError("Unable to get your location. " + err.message);
        }
    );
});

async function getWeather(query) {
    hideError();
    try {
        const geo = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
                query
            )}&limit=1&appid=${API_KEY}`
        ).then((r) => handleResponse(r));
        if (!geo.length) throw new Error(`City "${query}" not found.`);
        const { lat, lon, name, country } = geo[0];
        const data = await fetchWeatherData(lat, lon, name, country);
        render(data);
    } catch (err) {
        showError(err.message);
    }
}

async function getWeatherByCoords(lat, lon) {
    hideError();
    try {
        const reverse = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
        ).then((r) => handleResponse(r));
        const name = reverse[0] ? reverse[0].name : "My location";
        const country = reverse[0] ? reverse[0].country : "";
        const data = await fetchWeatherData(lat, lon, name, country);
        render(data);
    } catch (err) {
        showError(err.message);
    }
}

async function fetchWeatherData(lat, lon, name, country) {
    const current = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    ).then((r) => handleResponse(r));

    const forecast = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    ).then((r) => handleResponse(r));

    return { current, forecast, name, country };
}

async function handleResponse(res) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.message || res.statusText;
        if (res.status === 401) {
            throw new Error(
                "Invalid API key. Please set YOUR_API_KEY in app.js."
            );
        }
        throw new Error(msg || `Request failed (${res.status}).`);
    }
    return res.json();
}

function render({ current, forecast, name, country }) {
    const timezoneOffset = (current.timezone || 0) * 1000;
    const now = new Date(Date.now() + timezoneOffset);

    cityEl.textContent = `${name}${country ? ", " + country : ""}`;
    dateEl.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
    iconEl.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;
    iconEl.alt = current.weather[0].description;
    tempEl.textContent = `${Math.round(current.main.temp)}°`;
    descEl.textContent = current.weather[0].description;
    feelsLikeEl.textContent = `${Math.round(current.main.feels_like)}°`;
    humidityEl.textContent = `${current.main.humidity}%`;
    windEl.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;
    pressureEl.textContent = `${current.main.pressure} hPa`;

    applyBackground(current.weather[0].main, current.weather[0].icon);
    renderForecast(forecast);
    sourceCityEl.textContent = name;
}

function renderForecast(forecast) {
    const daily = forecast.list
        .filter((item) => item.dt_txt.endsWith("12:00:00"))
        .slice(0, 5);

    forecastGrid.innerHTML = "";
    if (!daily.length) return;

    daily.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <div class="forecast-day">${date.toLocaleDateString("en-US", {
                weekday: "short",
            })}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${
                item.weather[0].icon
            }@2x.png" alt="${item.weather[0].description}" />
            <div class="forecast-temp">${Math.round(item.main.temp)}°</div>
            <div class="forecast-high-low">H ${Math.round(
                item.main.temp_max
            )}° · L ${Math.round(item.main.temp_min)}°</div>
        `;
        forecastGrid.appendChild(card);
    });
}

function applyBackground(condition, icon) {
    const bg = document.getElementById("background");
    const day = icon && !icon.endsWith("n");
    let gradient;

    if (condition === "Clear") {
        gradient = day
            ? "linear-gradient(160deg, #0ea5e9 0%, #38bdf8 45%, #7dd3fc 80%)"
            : "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #334155 100%)";
    } else if (condition === "Rain" || condition === "Drizzle") {
        gradient = "linear-gradient(160deg, #1e3a8a 0%, #3b82f6 45%, #94a3b8 90%)";
    } else if (condition === "Thunderstorm") {
        gradient = "linear-gradient(160deg, #111827 0%, #312e81 50%, #6366f1 100%)";
    } else if (condition === "Snow") {
        gradient = day
            ? "linear-gradient(160deg, #64748b 0%, #bae6fd 50%, #f8fafc 90%)"
            : "linear-gradient(160deg, #0f172a 0%, #475569 60%, #cbd5e1 100%)";
    } else if (condition === "Clouds") {
        gradient = day
            ? "linear-gradient(160deg, #334155 0%, #64748b 50%, #cbd5e1 100%)"
            : "linear-gradient(160deg, #0b1220 0%, #1e293b 60%, #475569 100%)";
    } else {
        gradient = day
            ? "linear-gradient(160deg, #1e3a8a 0%, #3b82f6 45%, #38bdf8 75%)"
            : "linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #334155 100%)";
    }

    bg.style.background = gradient;
}

function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
}

function hideError() {
    errorEl.classList.add("hidden");
}

(async function init() {
    if (API_KEY === "YOUR_API_KEY") {
        cityEl.textContent = "Add your API key";
        dateEl.textContent = "";
        showError(
            "Please open app.js and replace YOUR_API_KEY with a valid OpenWeather API key."
        );
        return;
    }
    try {
        const geo = await fetch(
            "https://api.openweathermap.org/geo/1.0/direct?q=Manila&limit=1&appid=" +
                API_KEY
        ).then((r) => handleResponse(r));
        if (geo.length) {
            getWeatherByCoords(geo[0].lat, geo[0].lon);
        }
    } catch {
        /* keep default hero state */
    }
})();
