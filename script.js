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

  // If a chart instance already exists, destroy it
  if (stockChartInstance) {
    stockChartInstance.destroy();
  }

  stockChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates, // X-axis (dates)
      datasets: [
        {
          label: `${ticker} Stock Price`,
          data: prices, // Y-axis (prices)
          borderColor: "white",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          fill: true,
          tension: 0.3, // Adds a smooth curve to the line
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
          },
          title: {
            display: true,
            text: "Date",
            color: "white", // Change x-axis title color to white
          },
          ticks: {
            color: "white", // Change x-axis tick label color to white
          },
        },
        y: {
          title: {
            display: true,
            text: "Price (USD)",
            color: "white", // Change y-axis title color to white
          },
          ticks: {
            color: "white", // Change y-axis tick label color to white
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
    },
  });
}

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

  try {
    // Fetch the data and then render it on the chart
    let data = await getHistoricalStockPrices(stockTicker);
    renderChart(data.dates, data.prices, stockTicker);
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
