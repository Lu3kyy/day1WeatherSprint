const output = document.getElementById("output");
const apiKey = "11f8c4085d8dde74e0cc1eba3f7a54e0";
const getForecastBtn = document.getElementById("getForecastBtn");
const cityInput = document.getElementById("cityInput");

//run when page loads
window.addEventListener("load", getLocation);
//get user location
function getLocation() {
    if (!navigator.geolocation) {
        output.textContent = "Geolocation not supported."; //error handling
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude; //get lat and lon
            const lon = position.coords.longitude;
            fetchForecast(lat, lon); //fetch forecast data using lat and lon
            fetchCurrentWeather(lat, lon); //fetch current weather data using lat and lon
        },
        () => {
            output.textContent = "Location permission denied."; //error handling
        }
    );
}
//fetch 5 day forecast data with lat and lon
function fetchForecast(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`) //fetches all info including some past dates
        .then(res => res.json())
        .then(data => {
            console.log("RAW FORECAST DATA:", data);
            const filteredList = data.list.filter(item => {
                const itemDate = new Date(item.dt * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
                return itemDate >= getTodayDateString();
            });

            const dailyForecast = processForecast(filteredList);
            displayForecast(dailyForecast);
        })
        .catch(() => {
            output.textContent = "Failed to load forecast."; //error handling
        });
}

//fetch current weather (short-term/current conditions) and log it
function fetchCurrentWeather(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`) //fetch current weather data
        .then(res => res.json())
        .then(data => {
            console.log("RAW CURRENT WEATHER DATA:", data); //log raw current weather data to view
        })
        .catch(() => {
            output.textContent = "Failed to load current weather."; //error handling
        });
}

//3 hour data 
function processForecast(list) {
    const days = {};

    list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
        const temp = item.main.temp;

        if (!days[date]) { // 
            days[date] = { // within each date, store high and low temps
                high: temp,
                low: temp
            };
        } else { //update high and low temps if needed
            days[date].high = Math.max(days[date].high, temp);//comparing current high with new temp
            days[date].low = Math.min(days[date].low, temp); //comparing current low with new temp
        }
    });
    const sortedDates = Object.keys(days).sort();
    const firstFive = sortedDates.slice(0, 5);
    return firstFive.map(date => [date, days[date]]);
}

//display 5 day forecast
function displayForecast(days) { 
    output.innerHTML = ""; //clear old content

    days.forEach(([date, temps]) => {
        const dayEl = document.createElement("div");
            dayEl.classList.add("dayCSS");
        dayEl.innerHTML = `
            <strong>${getDayName(date)},  ${date}</strong><br>
            High: ${Math.round(temps.high)}°<br>
            Low: ${Math.round(temps.low)}°
            <hr>
        `;
        output.appendChild(dayEl);
    });
}


function getDayName(dateString) { //convert date string to day name
    const date = new Date(`${dateString}T12:00:00`); //set time to noon to avoid timezone issues
    return date.toLocaleDateString("en-US", { weekday: "short", timeZone: 'America/Los_Angeles' }); //get short day name
}

function getTodayDateString() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); //from current date object and format to YYYY-MM-DD and set timezone
}

getForecastBtn.addEventListener("click", () => { //HOLY MOLY IT WOKRS, this is my search function
    const city = cityInput.value.trim();
    if (city) {
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`)
            .then(res => res.json())
            .then(data => {
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
