// Section 1 & 2: Everything about AAPL.
// Function: To retrieve stock data from Alpha Vantage API
async function getHistoricalStockPrices(ticker) {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://alpha-vantage.p.rapidapi.com/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=compact&datatype=json`,
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "alpha-vantage.p.rapidapi.com",
    },
  };

  try {
    // Await the axios request and get the response directly
    const response = await axios.request(config);
    const timeSeries = response.data["Time Series (Daily)"];

    const datesArray = Object.keys(timeSeries);
    const pricesArray = Object.values(timeSeries);

    // Extract and structure data for Chart.js
    const dates = [];
    const prices = [];
    for (const date of datesArray) {
      dates.push(date);
    }
    for (let i = 0; i < pricesArray.length; i++) {
      prices.push(parseFloat(pricesArray[i]["4. close"].replace(/'/g, "")));
    }
    // Reverse the arrays to display data chronologically from oldest to newest
    dates.reverse();
    prices.reverse();

    return {
      dates,
      prices,
    };

    //   console.log(dates);
    //   console.log(prices);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return {
      dates: [],
      prices: [],
    }; // Return empty arrays in case of error
  }
}

// Function: To fetch predicted stock prices for next day and next week
async function getPredictedStockPrices(ticker) {
  const CACHE_EXPIRY_HOURS = 24; // Expiry time in hours
  const STORAGE_KEY = `predictedStockPrices_${ticker}`; // Use ticker-specific storage key

  // Check if data is in local storage and still valid
  const cachedData = localStorage.getItem(STORAGE_KEY);

  if (cachedData) {
    const parsedData = JSON.parse(cachedData);

    // Check if the ticker matches and the data is still valid
    if (parsedData.ticker === ticker) {
      const now = new Date();
      const cachedTimestamp = new Date(parsedData.timestamp);

      // Calculate time difference in hours
      const hoursSinceCache = (now - cachedTimestamp) / (1000 * 60 * 60);

      if (hoursSinceCache < CACHE_EXPIRY_HOURS) {
        console.log(`Using cached data for ${ticker} predicted stock prices.`);
        return parsedData.data; // Return cached data if still valid
      } else {
        // Cache expired: Remove it from local storage
        console.log(
          `Cache expired. Clearing cached data for ${ticker} predicted stock prices.`
        );
        localStorage.removeItem(STORAGE_KEY); // Clear expired cache for this ticker
      }
    }
  }

  // If no valid cached data, make API calls
  let nextDayConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://ai-stock-prediction-recommendations.p.rapidapi.com/next-day-prediction?ticker=${ticker}`,
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "ai-stock-prediction-recommendations.p.rapidapi.com",
    },
  };

  let nextWeekConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://ai-stock-prediction-recommendations.p.rapidapi.com/next-week-prediction?ticker=${ticker}`,
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "ai-stock-prediction-recommendations.p.rapidapi.com",
    },
  };

  try {
    const [nextDayResponse, nextWeekResponse] = await Promise.all([
      axios.request(nextDayConfig),
      axios.request(nextWeekConfig),
    ]);

    const nextDayPredPrice = nextDayResponse.data.predicted_price;
    const nextWeekPredPrice = nextWeekResponse.data.predicted_price;

    const today = new Date();

    // Compute next day and next week dates
    let nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    if (nextDay.getDay() === 6) nextDay.setDate(nextDay.getDate() + 2); // Adjust for weekend
    if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1);

    let nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    if (nextWeek.getDay() === 6) nextWeek.setDate(nextWeek.getDate() + 2); // Adjust for weekend
    if (nextWeek.getDay() === 0) nextWeek.setDate(nextWeek.getDate() + 1);

    const formattedNextDay = nextDay.toISOString().split("T")[0];
    const formattedNextWeek = nextWeek.toISOString().split("T")[0];

    const dataToCache = {
      dates: [formattedNextDay, formattedNextWeek],
      prices: [nextDayPredPrice, nextWeekPredPrice],
    };

    // Save to localStorage using a dynamic key based on ticker
    localStorage.setItem(
      STORAGE_KEY, // Dynamic storage key per ticker
      JSON.stringify({
        ticker, // Store the ticker
        timestamp: new Date().toISOString(), // Current timestamp
        data: dataToCache, // Store the prediction data
      })
    );

    return dataToCache; // Return the newly fetched data
  } catch (error) {
    console.error("Error fetching predicted stock data:", error);
    return {
      dates: [],
      prices: [],
    };
  }
}

// Function: To render stock data on a chart using Chart.js
// Define a global variable to store the chart instance
let stockChartInstance;

function renderChart(dates, prices, ticker, predictedDates, predictedPrices) {
  const ctx = document.getElementById("stockChart").getContext("2d");

  if (stockChartInstance) {
    stockChartInstance.destroy();
  }

  stockChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: `${ticker} Stock Price`,
          data: dates.map((date, index) => ({
            x: date,
            y: prices[index],
          })), // First dataset
          borderColor: "white",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          fill: false,
          tension: 0.3,
          radius: 3,
        },
        {
          label: `Predicted ${ticker} Stock Price`,
          data: predictedDates.map((date, index) => ({
            x: date,
            y: predictedPrices[index],
          })), // Second dataset
          borderColor: "#FF9C73",
          backgroundColor: "rgba(255, 156, 115, 0.5)",
          fill: false,
          tension: 0.3,
          radius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
          },
          title: {
            display: true,
            text: "Date",
            color: "white",
          },
          ticks: {
            color: "white",
          },
        },
        y: {
          title: {
            display: true,
            text: "Price (USD)",
            color: "white",
          },
          ticks: {
            color: "white",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "white",
          },
        },
      },
    },
  });
}

// Function: To retrieve stock recommendation from API
async function getStockRecommendation(ticker) {
  const CACHE_EXPIRY_HOURS = 24; // Cache expiry time in hours
  const STORAGE_KEY = `stockDataRecommendation_${ticker}`; // Use a dynamic key based on the ticker

  // Check if data is in local storage and still valid
  const cachedData = localStorage.getItem(STORAGE_KEY);

  if (cachedData) {
    const parsedData = JSON.parse(cachedData);

    if (parsedData.ticker === ticker) {
      const now = new Date();
      const cachedTimestamp = new Date(parsedData.timestamp);
      const hoursSinceCache = (now - cachedTimestamp) / (1000 * 60 * 60); // Calculate the hours since cache was last updated

      if (hoursSinceCache < CACHE_EXPIRY_HOURS) {
        console.log(`Using cached data for ${ticker} stock recommendation.`);
        return parsedData.data; // Return cached data if still valid
      } else {
        // Cache expired: Remove the cached entry
        console.log(
          `Cached data for ${ticker} is expired. Clearing from local storage.`
        );
        localStorage.removeItem(STORAGE_KEY); // Clear expired cache for this ticker
      }
    }
  }

  // If no valid cached data, fetch from the API
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://ai-stock-prediction-recommendations.p.rapidapi.com/stock-recommendation?ticker=${ticker}`,
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "ai-stock-prediction-recommendations.p.rapidapi.com",
    },
  };

  try {
    // Await the axios request and get the response directly
    const response = await axios.request(config);
    const confidenceScore = response.data["confidence_score"];
    const recommendation = response.data["recommendation"];

    const result = {
      confidenceScore,
      recommendation,
    };

    // Store the result in local storage with a timestamp
    localStorage.setItem(
      STORAGE_KEY, // Use the dynamic storage key based on ticker
      JSON.stringify({
        ticker, // Store the ticker along with the data for future validation
        timestamp: new Date().toISOString(), // Current time as the timestamp
        data: result, // Store the data
      })
    );

    return result; // Return the result fetched from the API
  } catch (error) {
    console.error("Error fetching stock data recommendation:", error);
    return {
      confidenceScore: null,
      recommendation: null,
    };
  }
}

// Render the default chart as soon as the page loads
window.onload = async function () {
  // Set default value for stockInput when the page loads
  let stockTicker = "AAPL";

  // Fetch historical stock prices and render the chart immediately
  try {
    let data = await getHistoricalStockPrices(stockTicker);
    let predData = await getPredictedStockPrices(stockTicker);
    let stockRecommendation = await getStockRecommendation(stockTicker);
    if (data) {
      console.log("Rendering chart with default stock data...");
      renderChart(
        data.dates,
        data.prices,
        stockTicker,
        predData.dates,
        predData.prices
      );

      // Update the section 2 stock description
      if (
        predData &&
        predData.dates &&
        predData.prices &&
        predData.dates.length >= 2 &&
        predData.prices.length >= 2
      ) {
        document.getElementById(
          "stock-desc"
        ).innerHTML = `This chart shows the daily closing price for ${stockTicker} stock over the latest 100 data points. 
        The orange line represents the predicted stock price for the next day and next week. <br><br>
        Based on technical indicators and fundamental analysis, the AI has predicted the stock price for ${stockTicker} on ${
          predData.dates[0]
        } is $${predData.prices[0].toFixed(2)} and on ${
          predData.dates[1]
        } is $${predData.prices[1].toFixed(2)}. <br><br> 
        The prediction has a confidence level of ${
          stockRecommendation.confidenceScore
        }, and the recommendation is to <strong>'${
          stockRecommendation.recommendation
        }'</strong> the stock.`;
      } else {
        document.getElementById(
          "stock-desc"
        ).innerHTML = `This chart shows the daily closing price for ${stockTicker} stock over the latest 100 data points. <br><br>
        The prediction data is unavailable at the moment.`;
      }

      // getStockNews(stockTicker);

      // Populate stock cards for Section 4
      let todayStockPrice = data.prices[data.prices.length - 1];
      populateStockCards(todayStockPrice);
    }
  } catch (error) {
    console.log("Error:", error);
  }
};

// Function: Get user input and return stock data to render chart
const stockInput = document.getElementById("stockInput");
const stockButton = document.getElementById("stockInput-btn");

// Define the function that runs when submitting
async function handleStockInput() {
  let stockTicker = stockInput.value;

  // Clear the input box
  stockInput.value = "";

  // Update the section 2 header
  document.getElementById(
    "section-2"
  ).innerText = `Everything about ${stockTicker}.`;

  // Update the section 3 header
  document.getElementById(
    "section-3"
  ).innerText = `Stay Informed: The Latest Developments on ${stockTicker}.`;

  // Update the section 4 header
  document.getElementById(
    "section-4"
  ).innerText = `See how much your investments could have earned till date for ${stockTicker}.`;

  try {
    // Fetch the data and then render it on the chart
    let data = await getHistoricalStockPrices(stockTicker);
    let predData = await getPredictedStockPrices(stockTicker);
    let stockRecommendation = await getStockRecommendation(stockTicker);
    renderChart(
      data.dates,
      data.prices,
      stockTicker,
      predData.dates,
      predData.prices
    );

    // Update the section 2 stock description
    if (
      predData &&
      predData.dates &&
      predData.prices &&
      predData.dates.length >= 2 &&
      predData.prices.length >= 2
    ) {
      document.getElementById(
        "stock-desc"
      ).innerHTML = `This chart shows the daily closing price for ${stockTicker} stock over the latest 100 data points. 
      The orange line represents the predicted stock price for the next day and next week. <br><br>
      Based on technical indicators and fundamental analysis, the AI has predicted the stock price for ${stockTicker} on ${
        predData.dates[0]
      } is $${predData.prices[0].toFixed(2)} and on ${
        predData.dates[1]
      } is $${predData.prices[1].toFixed(2)}. <br><br> 
      The prediction has a confidence level of ${
        stockRecommendation.confidenceScore
      }, and the recommendation is to <strong>'${
        stockRecommendation.recommendation
      }'</strong> the stock.`;
    } else {
      document.getElementById(
        "stock-desc"
      ).innerHTML = `This chart shows the daily closing price for ${stockTicker} stock over the latest 100 data points. <br><br>
      The prediction data is unavailable at the moment.`;
    }
    // getStockNews(stockTicker);

    // Populate stock cards for Section 4
    let todayStockPrice = data.prices[data.prices.length - 1];
    populateStockCards(todayStockPrice);

    // Clear old simulation, if any
    const tableBody = document.getElementById("stockTableBody");
    while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }
  } catch (error) {
    console.log("Error: ", error);
  }
}

// Add click event listener for button
stockButton.addEventListener("click", handleStockInput);

// Add keydown event listener for Enter key on the input field
stockInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleStockInput();
  }
});

// Section 3: Stay Informed: The Latest Developments on AAPL.
// Function: To retrieve news related to the stock via FinanceBird data sourced from Yahoo Finance
async function getStockNews(ticker) {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://financebird.p.rapidapi.com/quote/${ticker}/news?count=3`,
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "financebird.p.rapidapi.com",
    },
  };

  try {
    // Await the axios request and get the response directly
    const response = await axios.request(config);

    const newsContainer = document.getElementById("news-container");

    // Clear previous news cards before appending new ones
    newsContainer.innerHTML = "";

    for (let news_num = 0; news_num < response.data.count; news_num++) {
      const newsTitle = response.data.news[news_num].title;
      const newsLink = response.data.news[news_num].link;
      const newsSource = response.data.news[news_num].publisher;
      // Optional Chaining to avoid errors if thumbnail is not available
      const newsThumbnail =
        response.data.news[news_num]?.thumbnail?.resolutions?.[0]?.url ||
        "images/logo.png";

      // console.log(newsTitle, newsLink, newsThumbnail, newsSource);

      // Create a new card
      const cardHTML = `
      <div class="card">
      <img class="card-img-top" src="${newsThumbnail}" alt="News Thumbnail" />
      <div class="card-body">
      <h5 class="card-title">${newsSource}</h5>
      <p class="card-text">${newsTitle}</p>
      <a href="${newsLink}" class="btn btn-primary">Read More</a>
      </div>
      </div>`;

      // Append the new card to the container
      newsContainer.insertAdjacentHTML("beforeend", cardHTML);
    }
  } catch (error) {
    console.error("Error fetching news data:", error);
  }
}

// Section 4: See how much your investments could have earned till date.
// Javascript for date picker input
document.addEventListener("DOMContentLoaded", function () {
  flatpickr("#datepicker", {
    dateFormat: "Y-m-d",
    defaultDate: "today",
  });
});

// JavaScript to handle form submission and dynamic table update
document
  .getElementById("stockDataInput-btn")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form from reloading the page

    // Get input values
    const date = document.getElementById("datepicker").value;
    const stockPrice = document.getElementById("stockPriceInput").value;
    const quantity = document.getElementById("stockQtyInput").value;

    // Validate inputs
    if (!date || !stockPrice || !quantity) {
      alert("Please fill out all fields.");
      return;
    }

    // Check if stock price and quantity are numbers
    if (isNaN(stockPrice) || isNaN(quantity)) {
      alert("Please enter valid numeric values for stock price and quantity.");
      return;
    }

    // Parse the numbers
    const parsedStockPrice = parseFloat(stockPrice);
    const parsedQuantity = parseInt(quantity, 10);

    // Check if parsing was successful (in case of empty strings or invalid formats)
    if (isNaN(parsedStockPrice) || isNaN(parsedQuantity)) {
      alert("Please enter valid numeric values for stock price and quantity.");
      return;
    }

    // Get the table body
    const tableBody = document.getElementById("stockTableBody");

    // Create a new row
    const newRow = document.createElement("tr");

    // Get the new row index
    const rowIndex = tableBody.rows.length + 1;

    // Add cells to the row
    newRow.innerHTML = `
      <th scope="row" class="row-index">${rowIndex}</th>
      <td class="date-cell">${date}</td>
      <td class="price-cell">$${parsedStockPrice.toFixed(2)}</td>
      <td class="quantity-cell">${parsedQuantity}</td>
    `;

    // Append the new row to the table body
    tableBody.appendChild(newRow);

    // Clear input fields after submission
    document.getElementById("datepicker").value = "";
    document.getElementById("stockPriceInput").value = "";
    document.getElementById("stockQtyInput").value = "";

    const { AvgStockPrice, totalStockReturn } = calculateStockStats();
    populateStockCards(
      document.getElementById("today-stock-price").textContent.replace("$", ""),
      AvgStockPrice,
      totalStockReturn
    );
  });

// Handle Reset Button Click
document
  .getElementById("resetTable-btn")
  .addEventListener("click", function () {
    const tableBody = document.getElementById("stockTableBody");

    // Clear all rows from the table body
    while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }

    // Optional: Clear input fields
    document.getElementById("datepicker").value = "";
    document.getElementById("stockPriceInput").value = "";
    document.getElementById("stockQtyInput").value = "";
  });

// Add Cards from Javascript
async function populateStockCards(
  todayStockPrice,
  yourAvgStockPrice = 0,
  yourTotalStockReturn = 0
) {
  const container = document.getElementById("stockCardsContainer");
  container.innerHTML = "";

  // Card 1
  const card1 = document.createElement("div");
  card1.classList.add("card", "stock-card");
  card1.innerHTML = `
      <div class="card-body">
        <h6 class="card-title">Today's Stock Price</h6>
        <h3 class="card-text" id="today-stock-price"><strong>$ ${todayStockPrice}</strong></h3>
    `;
  container.appendChild(card1);

  // Card 2
  const card2 = document.createElement("div");
  card2.classList.add("card", "stock-card");
  card2.innerHTML = `
      <div class="card-body">
        <h6 class="card-title">Your Average <br> Stock Price</h6>
        <h3 class="card-text"><strong>$ ${yourAvgStockPrice}</strong></h3>
    `;
  container.appendChild(card2);

  // Card 3
  const card3 = document.createElement("div");
  card3.classList.add("card", "stock-card");
  card3.innerHTML = `
      <div class="card-body">
        <h6 class="card-title">Your Total <br> Stock Returns</h6>
        <h3 class="card-text"><strong>$ ${yourTotalStockReturn}</strong></h3>
    `;
  container.appendChild(card3);
}

function calculateStockStats() {
  // Get price and quantity cells
  const priceCells = document.querySelectorAll(".price-cell");
  const userPrices = Array.from(priceCells).map((cell) => cell.textContent);

  const qtyCells = document.querySelectorAll(".quantity-cell");
  const userQuantities = Array.from(qtyCells).map((cell) =>
    parseInt(cell.textContent)
  );

  // Calculate total quantity
  const totalQty = userQuantities.reduce(
    (total, current) => total + current,
    0
  );

  // Calculate total investment
  const totalInvestment = userPrices.reduce((total, current, index) => {
    const price = parseFloat(current.replace("$", ""));
    return total + price * userQuantities[index];
  }, 0);

  // Calculate average stock price
  let AvgStockPrice = (totalInvestment / totalQty).toFixed(2);

  // Get today's stock price and calculate market value
  let marketValue = (
    totalQty *
    parseFloat(
      document
        .getElementById("today-stock-price")
        .textContent.replace("$", "")
        .trim()
    )
  ).toFixed(2);

  // Calculate total stock return
  let totalStockReturn = (marketValue - totalInvestment).toFixed(2);

  // Return both AvgStockPrice and totalStockReturn
  return { AvgStockPrice, totalStockReturn };
}
