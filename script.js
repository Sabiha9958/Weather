class WeatherApp {
  constructor() {
    this.apiKey = "da5cc509bc967933cf9f957a7a06eb9b";
    this.currentTempUnit = "metric";
    this.currentWeatherData = null;
    this.init();
  }

  init() {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 60000);
    this.setupEventListeners();
    this.createParticles();
  }

  setupEventListeners() {
    const cityInput = document.getElementById("city");
    const locationBtn = document.getElementById("locationBtn");

    cityInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.getWeather();
      }
    });

    locationBtn.addEventListener("click", () => {
      this.getCurrentLocation();
    });

    // Auto-suggestions
    cityInput.addEventListener("input", (e) => {
      this.showSuggestions(e.target.value);
    });
  }

  createParticles() {
    const particlesContainer = document.getElementById("particles");
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div");
      particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                animation: float ${Math.random() * 3 + 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
      particlesContainer.appendChild(particle);
    }
  }

  updateDateTime() {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    document.getElementById("currentDate").textContent = now.toLocaleDateString(
      "en-US",
      options
    );
  }

  showLoading(show = true) {
    const loadingContainer = document.getElementById("loadingContainer");
    const weatherContainer = document.getElementById("currentWeatherContainer");

    if (show) {
      loadingContainer.style.display = "block";
      weatherContainer.style.display = "none";
    } else {
      loadingContainer.style.display = "none";
      weatherContainer.style.display = "block";
    }
  }

  showError(message) {
    alert(message); // You can replace this with a better error display
  }

  async getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await this.getWeatherByCoords(latitude, longitude);
      },
      (error) => {
        this.showError("Unable to retrieve your location.");
      }
    );
  }

  async getWeatherByCoords(lat, lon) {
    this.showLoading(true);
    try {
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.currentTempUnit}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${this.currentTempUnit}`;

      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl),
      ]);

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error("Weather data unavailable");
      }

      const currentData = await currentResponse.json();
      const forecastData = await forecastResponse.json();

      this.currentWeatherData = currentData;
      this.displayCurrentWeather(currentData);
      this.displayHourlyForecast(forecastData);
      this.displayWeeklyForecast(forecastData);
      this.changeBackgroundTheme(currentData.weather[0].main.toLowerCase());
    } catch (error) {
      this.showError("Failed to fetch weather data. Please try again.");
    } finally {
      this.showLoading(false);
    }
  }

  async getWeather() {
    const city = document.getElementById("city").value.trim();
    if (!city) {
      this.showError("Please enter a city name.");
      return;
    }

    this.showLoading(true);
    try {
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}&units=${this.currentTempUnit}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${this.apiKey}&units=${this.currentTempUnit}`;

      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl),
      ]);

      if (!currentResponse.ok) {
        throw new Error("City not found");
      }

      const currentData = await currentResponse.json();
      const forecastData = await forecastResponse.json();

      this.currentWeatherData = currentData;
      this.displayCurrentWeather(currentData);
      this.displayHourlyForecast(forecastData);
      this.displayWeeklyForecast(forecastData);
      this.changeBackgroundTheme(currentData.weather[0].main.toLowerCase());
    } catch (error) {
      this.showError(
        error.message === "City not found"
          ? "City not found. Please check the spelling."
          : "Failed to fetch weather data. Please try again."
      );
    } finally {
      this.showLoading(false);
    }
  }

  displayCurrentWeather(data) {
    const tempUnit = this.currentTempUnit === "metric" ? "°C" : "°F";
    const windUnit = this.currentTempUnit === "metric" ? "km/h" : "mph";

    document.getElementById(
      "cityName"
    ).textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById("temperature").textContent = `${Math.round(
      data.main.temp
    )}${tempUnit}`;
    document.getElementById("description").textContent =
      data.weather[0].description;
    document.getElementById("feelsLike").textContent = `Feels like ${Math.round(
      data.main.feels_like
    )}${tempUnit}`;

    // Enhanced Weather icon with better error handling
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const weatherIconElement = document.getElementById("weatherIcon");

    if (weatherIconElement) {
      weatherIconElement.src = iconUrl;
      weatherIconElement.alt = `${data.weather[0].description} icon`;
      weatherIconElement.onerror = function () {
        // Fallback if icon fails to load
        this.src = "https://openweathermap.org/img/wn/01d@2x.png";
      };
    }

    // Detailed weather information
    document.getElementById("visibility").textContent = `${(
      data.visibility / 1000
    ).toFixed(1)} km`;
    document.getElementById("humidity").textContent = `${data.main.humidity}%`;
    document.getElementById("windSpeed").textContent = `${Math.round(
      data.wind.speed * (this.currentTempUnit === "metric" ? 3.6 : 1)
    )} ${windUnit}`;
    document.getElementById(
      "pressure"
    ).textContent = `${data.main.pressure} hPa`;
    document.getElementById("cloudiness").textContent = `${data.clouds.all}%`;
    document.getElementById("uvIndex").textContent = "N/A";

    // Sunrise and sunset
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    document.getElementById("sunrise").textContent = sunrise.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
    document.getElementById("sunset").textContent = sunset.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    // Last updated
    document.getElementById(
      "lastUpdated"
    ).textContent = `Updated: ${new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  displayHourlyForecast(data) {
    const hourlyContainer = document.getElementById("hourlyForecast");
    hourlyContainer.innerHTML = "";
    const tempUnit = this.currentTempUnit === "metric" ? "°C" : "°F";

    // Show next 24 hours (8 items, 3-hour intervals)
    for (let i = 0; i < 8; i++) {
      const item = data.list[i];
      const time = new Date(item.dt * 1000);
      const temp = Math.round(item.main.temp);
      const iconCode = item.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

      const hourlyItem = document.createElement("div");
      hourlyItem.className = "hourly-item";
      hourlyItem.style.animationDelay = `${i * 0.1}s`;
      hourlyItem.innerHTML = `
                <div class="hour-time">${time.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</div>
                <img src="${iconUrl}" alt="${item.weather[0].description}" 
                     onerror="this.src='https://openweathermap.org/img/wn/01d.png'"/>
                <div class="hour-temp">${temp}${tempUnit}</div>
                <div class="hour-desc">${item.weather[0].main}</div>
                <div class="hour-rain">${Math.round(
                  (item.pop || 0) * 100
                )}%</div>
            `;

      hourlyContainer.appendChild(hourlyItem);
    }
  }

  displayWeeklyForecast(data) {
    const weeklyContainer = document.getElementById("weeklyForecast");
    weeklyContainer.innerHTML = "";

    const tempUnit = this.currentTempUnit === "metric" ? "°C" : "°F";
    const dailyData = {};

    // Group forecast data by day
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const day = date.toDateString();

      if (!dailyData[day]) {
        dailyData[day] = {
          temps: [],
          weather: item.weather[0],
          date: date,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
        };
      }
      dailyData[day].temps.push(item.main.temp);
    });

    // Create daily forecast items
    Object.values(dailyData)
      .slice(0, 5)
      .forEach((day, index) => {
        const maxTemp = Math.round(Math.max(...day.temps));
        const minTemp = Math.round(Math.min(...day.temps));
        const iconCode = day.weather.icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

        const dailyItem = document.createElement("div");
        dailyItem.className = "daily-item";
        dailyItem.style.animationDelay = `${index * 0.1}s`;
        dailyItem.innerHTML = `
                <div class="day-info">
                    <div class="day-name">${day.date.toLocaleDateString(
                      "en-US",
                      { weekday: "long" }
                    )}</div>
                    <div class="day-desc">${day.weather.description}</div>
                </div>
                <div class="day-icon">
                    <img src="${iconUrl}" alt="${day.weather.description}" 
                         onerror="this.src='https://openweathermap.org/img/wn/01d.png'"/>
                </div>
                <div class="day-details">
                    <span class="day-humidity"><i class="fas fa-tint"></i> ${
                      day.humidity
                    }%</span>
                    <span class="day-wind"><i class="fas fa-wind"></i> ${Math.round(
                      day.windSpeed * 3.6
                    )} km/h</span>
                </div>
                <div class="day-temps">
                    <span class="temp-max">${maxTemp}${tempUnit}</span>
                    <span class="temp-min">${minTemp}${tempUnit}</span>
                </div>
            `;

        weeklyContainer.appendChild(dailyItem);
      });
  }

  toggleTempUnit() {
    this.currentTempUnit =
      this.currentTempUnit === "metric" ? "imperial" : "metric";
    if (this.currentWeatherData) {
      // Refresh weather data with new unit
      this.getWeatherByCoords(
        this.currentWeatherData.coord.lat,
        this.currentWeatherData.coord.lon
      );
    }
  }

  changeBackgroundTheme(weatherCondition) {
    const body = document.body;

    // Remove existing weather classes
    body.classList.remove("sunny", "cloudy", "rainy", "snowy", "foggy");

    // Add appropriate class based on weather
    switch (weatherCondition) {
      case "clear":
        body.classList.add("sunny");
        break;
      case "clouds":
        body.classList.add("cloudy");
        break;
      case "rain":
      case "drizzle":
        body.classList.add("rainy");
        break;
      case "snow":
        body.classList.add("snowy");
        break;
      case "mist":
      case "fog":
        body.classList.add("foggy");
        break;
    }
  }

  showSuggestions(query) {
    // Placeholder for city suggestions
    // You can implement city suggestions here using a cities API
  }
}
