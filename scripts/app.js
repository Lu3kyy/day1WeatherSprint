const output = document.getElementById("output");
const apiKey = "11f8c4085d8dde74e0cc1eba3f7a54e0";

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
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`)
        .then(res => res.json())
        .then(data => {
            console.log("RAW FORECAST DATA:", data); //log raw data to view
            const filteredList = data.list.filter(item => { //filter out past dates and times
                const itemDate = item.dt_txt.split(" ")[0]; //get date part only and compare to today's date
                return itemDate >= getTodayDateString(); //retain only items from today onwards
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
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`)
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
        const date = item.dt_txt.split(" ")[0]; //get date part only
        const temp = item.main.temp;

        if (!days[date]) {
            days[date] = {
                high: temp,
                low: temp
            };
        } else {
            days[date].high = Math.max(days[date].high, temp);
            days[date].low = Math.min(days[date].low, temp);
        }
    });
    const sortedDates = Object.keys(days).sort();
    const firstFive = sortedDates.slice(0, 5);
    return firstFive.map(date => [date, days[date]]);
}

//display 5 day forecast
function displayForecast(days) {
    output.innerHTML = "";

    days.forEach(([date, temps]) => {
        const dayEl = document.createElement("div");
        dayEl.innerHTML = `
            <strong>${getDayName(date)},  ${date}</strong><br>
            High: ${Math.round(temps.high)}°F<br>
            Low: ${Math.round(temps.low)}°F
            <hr width="25%">
        `;
        output.appendChild(dayEl);
    });
}

//helper to get day name from date string
function getDayName(dateString) {
    const [year, month, day] = dateString.split("-");
    const date = new Date(year, month - 1, day); // local time, not UTC
    return date.toLocaleDateString("en-US", { weekday: "short" });
}


function getTodayDateString() { //helper to get today's date in YYYY-MM-DD format
    return new Date().toISOString().split("T")[0]; //convert to ISO and split to get date part ex. "2024-06-15"
}