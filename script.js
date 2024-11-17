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

// Function: To render stock data on a chart using Chart.js
// Define a global variable to store the chart instance
let stockChartInstance;

function renderChart(dates, prices, ticker) {
  const ctx = document.getElementById("stockChart").getContext("2d");

  // Total duration of the animation (in milliseconds)
  const totalDuration = 2500;
  const delayBetweenPoints = totalDuration / prices.length;

  // Function to get the previous Y position for smooth animation
  const previousY = (ctx) =>
    ctx.index === 0
      ? ctx.chart.scales.y.getPixelForValue(100)
      : ctx.chart
          .getDatasetMeta(ctx.datasetIndex)
          .data[ctx.index - 1].getProps(["y"], true).y;

  // Define the custom animation for X and Y axes
  const animation = {
    x: {
      type: "number",
      easing: "linear", // Linear easing for smooth transition
      duration: delayBetweenPoints, // Duration for each X point
      from: NaN, // Initially the point is skipped
      delay(ctx) {
        if (ctx.type !== "data" || ctx.xStarted) {
          return 0;
        }
        ctx.xStarted = true; // Mark that the X animation has started for this point
        return ctx.index * delayBetweenPoints; // Delay based on the index of the point
      },
    },
    y: {
      type: "number",
      easing: "linear", // Linear easing for smooth transition
      duration: delayBetweenPoints, // Duration for each Y point
      from: previousY, // Use the previous Y value to ensure smooth transitions
      delay(ctx) {
        if (ctx.type !== "data" || ctx.yStarted) {
          return 0;
        }
        ctx.yStarted = true; // Mark that the Y animation has started for this point
        return ctx.index * delayBetweenPoints; // Delay based on the index of the point
      },
    },
  };

  // If a chart instance already exists, destroy it
  if (stockChartInstance) {
    stockChartInstance.destroy();
  }

  // Create the chart with the progressive animation
  stockChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates, // X-axis (dates)
      datasets: [
        {
          label: `${ticker} Stock Price`,
          data: prices, // Y-axis (prices)
          borderColor: "white", // Line color
          backgroundColor: "rgba(255, 255, 255, 0.5)", // Background color for the line
          fill: false, // Fill under the line
          tension: 0.3, // Smooth curve for the line
          radius: 3, // No radius on points
        },
      ],
    },
    options: {
      responsive: true, // Make the chart responsive to window resizing
      maintainAspectRatio: false, // Allow chart to adjust its size
      scales: {
        x: {
          type: "time", // X-axis will be a time scale
          time: {
            unit: "day", // Display data by day
          },
          title: {
            display: true,
            text: "Date",
            color: "white", // Change title color to white
          },
          ticks: {
            color: "white", // Change tick label color to white
          },
        },
        y: {
          title: {
            display: true,
            text: "Price (USD)",
            color: "white", // Change title color to white
          },
          ticks: {
            color: "white", // Change tick label color to white
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "white", // Change legend label color to white
          },
        },
      },
      animation, // Apply the custom animation
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
    if (data) {
      console.log("Rendering chart with default stock data...");
      renderChart(data.dates, data.prices, stockTicker);
      // // Fetch and render the latest news related to the stock
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
    renderChart(data.dates, data.prices, stockTicker);
    // // Fetch and render the latest news related to the stock
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
