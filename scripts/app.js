const output = document.getElementById("output");
const apiKey = "11f8c4085d8dde74e0cc1eba3f7a54e0";
const getForecastBtn = document.getElementById("getForecastBtn");
const cityInput = document.getElementById("cityInput");

const weatherImageMap = {
  Clear: '../images/icons8-summer-100.png',
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

const defaultWeatherImage = './images/icons8-summer-100.png';
const locationNameEl = document.getElementById('locationName');
const currentTempEl = document.getElementById('currentTemp');
const currentCondEl = document.getElementById('currentCond');
const minTempEl = document.getElementById('minTemp');
const maxTempEl = document.getElementById('maxTemp');
const locationIconEl = document.getElementById('locationIcon');

let currentCity = "";
let favoritesMenuOpen = false;

// Favorites functions
function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function isFavorite(city) {
  return getFavorites().includes(city);
}

function updateFavoriteIcon() {
  const favoriteBtn = document.getElementById("favoriteBtn");
  if (isFavorite(currentCity)) {
    favoriteBtn.src = "./images/icons8-heart-100.png"; // filled heart
  } else {
    favoriteBtn.src = "./images/icons8-heart-100 (1).png"; // empty heart
  }
}

function renderFavorites() {
  const list = document.getElementById("favoritesList");
  const favorites = getFavorites();
  list.innerHTML = "";
  
  if (favorites.length === 0) {
    list.innerHTML = "<li>No favorites</li>";
    return;
  }
  
  favorites.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.style.cursor = "pointer";
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      cityInput.value = city;
      getForecastBtn.click();
      favoritesMenu.classList.add("hidden");
      favoritesMenuOpen = false;
    });
    list.appendChild(li);
  });
}

// Save last searched city to localStorage
function saveLastCity(city) {
  localStorage.setItem("lastCity", city);
}

function getLastCity() {
  return localStorage.getItem("lastCity");
}

// Run when page loads
window.addEventListener("load", () => {
  const lastCity = getLastCity();
  
  if (lastCity) {
    // Load last searched city
    cityInput.value = lastCity;
    searchByCity(lastCity);
  } else {
    // Fall back to geolocation
    getLocation();
  }
});

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
      updateCurrentWeatherDisplay(data);
    })
    .catch(() => {
      output.textContent = "Failed to load current weather.";
    });
}

function updateCurrentWeatherDisplay(data) {
  if (data && typeof data === 'object') {
    if (data.name) {
      currentCity = data.name;
      locationNameEl.textContent = data.name;
      saveLastCity(currentCity);
      saveRecentSearch(currentCity); // Save to localStorage
      updateFavoriteIcon();
    }
    
    if (data.main && typeof data.main.temp !== 'undefined' && currentTempEl) {
      currentTempEl.textContent = `${Math.round(data.main.temp)}°F`;
    }
    
    if (data.weather && data.weather[0] && currentCondEl) {
      currentCondEl.textContent = data.weather[0].main;
      
      const cond = data.weather[0].main;
      if (locationIconEl) {
        const mapped = weatherImageMap[cond] || defaultWeatherImage;
        locationIconEl.src = mapped;
      }
    }
  }
}

function processForecast(list) {
  const days = {};
  
  list.forEach((item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString("en-CA", {
      timeZone: "America/Los_Angeles",
    });
    const temp = item.main.temp;
    const cond = (item.weather && item.weather[0] && item.weather[0].main) 
      ? item.weather[0].main 
      : 'Clear';
    
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
      keys.forEach(k => {
        if (counts[k] > counts[best]) best = k;
      });
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
      let img = weatherImageMap[cond] || defaultWeatherImage;
      
      if (iconEl) {
        iconEl.src = img;
        iconEl.onerror = () => {
          iconEl.src = defaultWeatherImage;
        };
      }
      
      box.style.opacity = 1;
    } else {
      dayNameEl.textContent = '';
      highEl.textContent = '--°';
      lowEl.textContent = '--°';
      box.style.opacity = 0.6;
    }
  });
  
  if (days && days[0]) {
    const todayTemps = days[0][1];
    if (todayTemps) {
      if (minTempEl) minTempEl.textContent = `${Math.round(todayTemps.low)}°`;
      if (maxTempEl) maxTempEl.textContent = `${Math.round(todayTemps.high)}°`;
    }
  }
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

function searchByCity(city) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`)
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

// Search button click
getForecastBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    searchByCity(city);
  }
});

// Enter key in input
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    getForecastBtn.click();
  }
});

// Favorite button - toggle menu OR toggle favorite
const favoriteBtn = document.getElementById("favoriteBtn");
const favoritesMenu = document.getElementById("favoritesMenu");

favoriteBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  
  // If menu is closed, open it
  if (!favoritesMenuOpen) {
    renderFavorites();
    favoritesMenu.classList.remove("hidden");
    favoritesMenuOpen = true;
  } 
  // If menu is open AND we have a current city, toggle favorite
  else if (currentCity) {
    let favorites = getFavorites();
    
    if (favorites.includes(currentCity)) {
      favorites = favorites.filter(city => city !== currentCity);
    } else {
      favorites.push(currentCity);
    }
    
    saveFavorites(favorites);
    updateFavoriteIcon();
    renderFavorites(); // Update the menu display
  }
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!favoritesMenu.contains(e.target) && e.target !== favoriteBtn) {
    favoritesMenu.classList.add("hidden");
    favoritesMenuOpen = false;
  }
});


function getRecentSearches() {
  return JSON.parse(localStorage.getItem("recentSearches")) || [];
}

function saveRecentSearch(city) {
  let searches = getRecentSearches();

  searches = searches.filter(c => c !== city);
  searches.unshift(city);
  searches = searches.slice(0, 3);

  localStorage.setItem("recentSearches", JSON.stringify(searches));
}


function renderRecentSearches() {
  const list = document.getElementById("recentSearchesList");
  const searches = getRecentSearches();

  list.innerHTML = "";

  if (searches.length === 0) {
    list.innerHTML = "<li>No recent searches</li>";
    return;
  }

  searches.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.style.cursor = "pointer";

    li.addEventListener("click", (e) => {
      e.stopPropagation();
      cityInput.value = city;
      getForecastBtn.click();
      recentSearches.classList.add("hidden");
    });

    list.appendChild(li);
  });
}


const recentSearches = document.getElementById("recentSearches");

cityInput.addEventListener("focus", () => {
  renderRecentSearches();
  recentSearches.classList.remove("hidden");
});

document.addEventListener("click", (e) => {
  if (!recentSearches.contains(e.target) && e.target !== cityInput) {
    recentSearches.classList.add("hidden");
  }
});
