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

    return { dates, prices };

    //   console.log(dates);
    //   console.log(prices);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return { dates: [], prices: [] }; // Return empty arrays in case of error
  }
}

// Function: To fetch predicted stock prices for next day and next week
async function getPredictedStockPrices(ticker) {
  // let nextDayConfig = {
  //   method: "get",
  //   maxBodyLength: Infinity,
  //   url: `https://ai-stock-prediction-recommendations.p.rapidapi.com/next-day-prediction?ticker=${ticker}`,
  //   headers: {
  //     "x-rapidapi-key": API_KEY,
  //     "x-rapidapi-host": "ai-stock-prediction-recommendations.p.rapidapi.com",
  //   },
  // };

  // let nextWeekConfig = {
  //   method: "get",
  //   maxBodyLength: Infinity,
  //   url: `https://ai-stock-prediction-recommendations.p.rapidapi.com/next-week-prediction?ticker=${ticker}`,
  //   headers: {
  //     "x-rapidapi-key": API_KEY,
  //     "x-rapidapi-host": "ai-stock-prediction-recommendations.p.rapidapi.com",
  //   },
  // };

  try {
    // Make the API requests in parallel
    const [nextDayResponse, nextWeekResponse] = await Promise.all([
      axios.request(nextDayConfig),
      axios.request(nextWeekConfig),
    ]);

    // Extract prices from the responses
    const nextDayPredPrice = nextDayResponse.data.predicted_price;
    const nextWeekPredPrice = nextWeekResponse.data.predicted_price;

    // Get the current date
    const today = new Date();

    // Compute the next day's date
    let nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    // Adjust if the next day is a weekend
    const nextDayOfWeek = nextDay.getDay();
    if (nextDayOfWeek === 6) {
      // If Saturday, set to Monday (+2 days)
      nextDay.setDate(nextDay.getDate() + 2);
    } else if (nextDayOfWeek === 0) {
      // If Sunday, set to Monday (+1 day)
      nextDay.setDate(nextDay.getDate() + 1);
    }

    // Compute the date for the next week
    let nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Adjust if next week date falls on a weekend
    const nextWeekDayOfWeek = nextWeek.getDay();
    if (nextWeekDayOfWeek === 6) {
      // If Saturday, set to Monday (+2 days)
      nextWeek.setDate(nextWeek.getDate() + 2);
    } else if (nextWeekDayOfWeek === 0) {
      // If Sunday, set to Monday (+1 day)
      nextWeek.setDate(nextWeek.getDate() + 1);
    }

    // Format the dates as YYYY-MM-DD
    const formattedNextDay = nextDay.toISOString().split("T")[0];
    const formattedNextWeek = nextWeek.toISOString().split("T")[0];

    console.log(
      [formattedNextDay, formattedNextWeek],
      [nextDayPredPrice, nextWeekPredPrice]
    );

    // Return the dates and prices arrays
    return {
      dates: [formattedNextDay, formattedNextWeek],
      prices: [nextDayPredPrice, nextWeekPredPrice],
    };
  } catch (error) {
    console.error("Error fetching predicted stock data:", error);
    return { dates: [], prices: [] }; // Return empty arrays in case of error
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
          data: dates.map((date, index) => ({ x: date, y: prices[index] })), // First dataset
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

// Render the default chart as soon as the page loads
window.onload = async function () {
  // Set default value for stockInput when the page loads
  let stockTicker = "AAPL";

  // Fetch historical stock prices and render the chart immediately
  try {
    let data = await getHistoricalStockPrices(stockTicker);
    let predData = await getPredictedStockPrices(stockTicker);
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
        The prediction has a confidence level of 0.95, and the recommendation is to <strong>'buy'</strong> the stock.`;
      } else {
        document.getElementById(
          "stock-desc"
        ).innerHTML = `This chart shows the daily closing price for ${stockTicker} stock over the latest 100 data points. <br><br>
        The prediction data is unavailable at the moment.`;
      }

      // getStockNews(stockTicker);
    }
  } catch (error) {
    console.log("Error fetching historical stock data:", error);
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

  try {
    // Fetch the data and then render it on the chart
    let data = await getHistoricalStockPrices(stockTicker);
    let predData = await getPredictedStockPrices(stockTicker);
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
      The prediction has a confidence level of 0.95, and the recommendation is to <strong>'buy'</strong> the stock.`;
    } else {
      document.getElementById(
        "stock-desc"
      ).innerHTML = `This chart shows the daily closing price for ${stockTicker} stock over the latest 100 data points. The prediction data is unavailable at the moment.`;
    }
    // getStockNews(stockTicker);
  } catch (error) {
    console.log("Error in rendering chart: ", error);
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
