const output = document.getElementById("output");
const apiKey = "11f8c4085d8dde74e0cc1eba3f7a54e0";
const getForecastBtn = document.getElementById("getForecastBtn");
const cityInput = document.getElementById("cityInput");

const weatherImageMap = { //setting up all my weather images
  Clear: './images/icons8-summer-100.png',
  Clouds: './images/icons8-partly-cloudy-day-100.png',
  Rain: './images/icons8-heavy-rain-100 (2).png',
  Drizzle: './images/icons8-light-rain-100 (1).png',
  Thunderstorm: './images/icons8-storm-with-heavy-rain-100.png',
  Snow: './images/icons8-snow-100.png',
  Mist: './images/icons8-fog-100.png',
  Fog: './images/icons8-fog-100.png',
  Haze: './images/icons8-haze-100.png',
  Smoke: './images/icons8-water-steam-100.png',
  Dust: './images/icons8-water-steam-100.png',
  Sand: './images/icons8-water-steam-100.png',
  Ash: './images/icons8-water-steam-100.png',
  Squall: './images/icons8-storm-with-heavy-rain-100.png',
  Tornado: './images/icons8-storm-with-heavy-rain-100.png'
};
const defaultWeatherImage = './images/icons8-partly-cloudy-day-100.png';

//run when page loads
window.addEventListener("load", getLocation);
function getLocation() {
  if (!navigator.geolocation) {
    output.textContent = "Geolocation not supported.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      fetchForecast(lat, lon);
      fetchCurrentWeather(lat, lon);
    },
    () => {
      output.textContent = "Location permission denied.";
    }
  );
}
function fetchForecast(lat, lon) {
  fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
  )
    .then((res) => res.json())
    .then((data) => {
      console.log("RAW FORECAST DATA:", data);
      const filteredList = data.list.filter((item) => {
        const itemDate = new Date(item.dt * 1000).toLocaleDateString("en-CA", {
          timeZone: "America/Los_Angeles",
        });
        return itemDate >= getTodayDateString();
      });

      const dailyForecast = processForecast(filteredList);
      const observedConditions = Array.from(new Set(filteredList.map(i => (i.weather && i.weather[0] && i.weather[0].main) || '').filter(Boolean)));
      if (observedConditions.length) console.log('Observed conditions in forecast:', observedConditions);
      displayForecast(dailyForecast);
    })
    .catch(() => {
      output.textContent = "Failed to load forecast.";
    });
}

function fetchCurrentWeather(lat, lon) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
  )
    .then((res) => res.json())
    .then((data) => {
      console.log("RAW CURRENT WEATHER DATA:", data);
    })
    .catch(() => {
      output.textContent = "Failed to load current weather.";
    });
}

function processForecast(list) {
  const days = {};

  list.forEach((item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });
    const temp = item.main.temp;
    const cond = (item.weather && item.weather[0] && item.weather[0].main) ? item.weather[0].main : 'Clear';

    if (!days[date]) {
      days[date] = { high: temp, low: temp, condCounts: {} };
    } else {
      days[date].high = Math.max(days[date].high, temp);
      days[date].low = Math.min(days[date].low, temp);
    }

    days[date].condCounts[cond] = (days[date].condCounts[cond] || 0) + 1;
  });

  const sortedDates = Object.keys(days).sort();
  const firstFive = sortedDates.slice(0, 5);

  firstFive.forEach(d => {
    const counts = days[d].condCounts || {};
    const keys = Object.keys(counts);
    if (keys.length) {
      let best = keys[0];
      keys.forEach(k => { if (counts[k] > counts[best]) best = k; });
      days[d].condition = best;
    } else {
      days[d].condition = 'Clear';
    }
  });

  const result = firstFive.map((date) => [date, days[date]]);
  return result;
}

function displayForecast(days) {
  const forecastRow = document.getElementById('forecastRow');
  if (!forecastRow) return;

  const boxes = forecastRow.querySelectorAll('.forecast-box');

  boxes.forEach((box, idx) => {
    const dayNameEl = box.querySelector('.day-name');
    const iconEl = box.querySelector('.weather-icon');
    const highEl = box.querySelector('.temp-high');
    const lowEl = box.querySelector('.temp-low');

    if (days[idx]) {
      const [date, temps] = days[idx];
      dayNameEl.textContent = getDayName(date);
      highEl.textContent = `${Math.round(temps.high)}°`;
      lowEl.textContent = `${Math.round(temps.low)}°`;
      const cond = temps.condition || 'Clear';
      let img = weatherImageMap[cond];
      if (!img) {
        console.warn(`No mapped image for condition: ${cond}. Falling back to day${idx + 1}.png`);
        img = `./images/day${idx + 1}.png`;
      }
      if (iconEl) {
        iconEl.src = img;
        iconEl.onerror = () => { iconEl.src = defaultWeatherImage; };
      }
      box.style.opacity = 1;
    } else {
      dayNameEl.textContent = '';
      highEl.textContent = '--°';
      lowEl.textContent = '--°';
      box.style.opacity = 0.6;
    }
  });
}

function getDayName(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "America/Los_Angeles",
  });
}

function getTodayDateString() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

getForecastBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.coord) {
          const lat = data.coord.lat;
          const lon = data.coord.lon;
          fetchForecast(lat, lon);
          fetchCurrentWeather(lat, lon);
        } else {
          output.textContent = "City not found.";
        }
      })
      .catch(() => {
        output.textContent = "Failed to load weather for the specified city.";
      });
  }
});

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    getForecastBtn.click();
  }
});

