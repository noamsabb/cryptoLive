"use strict";

(() => {
  let checkedCurrencies = [];
  let currencies = null;
  const cardsDivContainer = document.getElementById("cardsDivContainer");
  const searchBoxInput = document.querySelector(".searchBox input");
  let counter = 0;

  //Page loaders
if (window.location.pathname.endsWith("/index.html") || window.location.pathname === "/") {    window.addEventListener("load", async () => {
      try {
        backgroundParallax();
        loadData();
        currencies = await getAllCurrencies();
        saveData();
        displayAllCurrencies(currencies);
        searchEngine();

        const params = new URLSearchParams(window.location.search);
        const preset = params.get("search");
        if (preset) {
          searchBoxInput.value = preset;
          searchCurrencies(preset);
        }
      } catch (err) {
        alert(err.message);
      }
    });
    document
      .getElementById("clearCheckedButton")
      .addEventListener("click", () => {
        clearAllChecked();
      });
  }
  if (window.location.pathname.endsWith("/liveReports.html")) {
    window.addEventListener("load", () => {
      if (window.Chart && window.ChartZoom) {
        Chart.register(ChartZoom);
      }
    });

    window.addEventListener("load", async () => {
      backgroundParallax();
      loadData();

      searchEngine();

      if (checkedCurrencies.length === 0) {
        emptyListLiveReports();
        return;
      }
      try {
        const chart = setGraph();
        liveReportGraph(chart);
      } catch (err) {
        alert(err.message);
      }
    });
  }
  if (window.location.pathname.endsWith("/about.html")) {
    window.addEventListener("load", () => {
      backgroundParallax();

      loadData();
      searchEngine();
    });
  }

  //Nav bar search handler
  function searchEngine() {
    searchBoxInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = searchBoxInput.value.toLowerCase();

        const path = window.location.pathname;
        // If we’re not on index.html, send the user there with ?search=…
        if (!path.endsWith("index.html") && path !== "/") {
          const target = new URL(window.location.origin + "/index.html");
          target.searchParams.set("search", query);
          window.location.href = target.toString();
          return;
        }
        searchCurrencies(query);
      }
    });
  }

  function searchCurrencies(query) {
    const searchedCoins = currencies.filter(
      ({ symbol, name }) =>
        symbol.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query)
    );

    let html = "";
    for (const coin of searchedCoins) {
      html += displayCard(coin);
    }

    cardsDivContainer.innerHTML = html;
    cardEvents();
  }

  async function getAllCurrencies() {
    const url =
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd";
    const response = await fetch(url);
    const currencies = await response.json();
    return currencies;
  }

  function displayAllCurrencies(currencies) {
    let cardsHtml = "";
    for (const currency of currencies) {
      cardsHtml += displayCard(currency);
    }
    cardsDivContainer.innerHTML = cardsHtml;

    cardEvents();
  }

  function displayCard(currency) {
    let checked = "";

    if (checkedCurrencies.includes(currency.symbol.toUpperCase()))
      checked = "checked";

    const card = `
      <div class="cardWrapper">
          <div class="infoPanel card">
            <div class="moreInfo">
          </div>
            <button class="closeInfoButton">CLOSE INFO</button>

          </div>
            <div class="card">
          <img
            src="${currency.image}"
            class="currencyImg"
          />
          <div class="textCardContainer">
            <div class="symbolDiv">${currency.symbol.toUpperCase()}</div>
            <div class="currencyId">${currency.id}</div>
            <div class="nameDiv">${currency.name}</div>
          </div>

      
        <label class="checkbox-wrapper">
        <input type="checkbox" class="tgl tgl-flat" ${checked}/>
         <span class="tgl-btn"></span>
        </label>
          <button class="showInfoButton">MORE INFO</button>
        </div>
        </div>
            `;
    return card;
  }

  //Get currency rates for more info Window
  async function getRates(currencyId) {
    const url = "https://api.coingecko.com/api/v3/coins/" + currencyId;
    const response = await fetch(url);
    const currencyMarket = await response.json();

    const rates = {
      USD: currencyMarket.market_data.current_price.usd,
      EUR: currencyMarket.market_data.current_price.eur,
      ILS: currencyMarket.market_data.current_price.ils,
    };
    return rates;
  }

  //Max coins window handler
  function maxCoinsWindow(addedCoin, addedToggle) {
    const radioSelectorContainer = document.getElementById(
      "radioSelectorContainer"
    );
    displayMaxCoinsWindow(radioSelectorContainer, addedCoin);

    document.querySelector(".overlay").classList.add("active");
    document.getElementById("maxCoinsWindowContainer").classList.add("active");

    //Max Coins Window buttons handler

    const cancelButton = document.querySelector(".cancelButton");

    //Clear olds EventListeners
    cancelButton.replaceWith(cancelButton.cloneNode(true));
    const newCancel = document.querySelector(".cancelButton");

    newCancel.addEventListener("click", () => {
      document.querySelector(".overlay").classList.remove("active");
      document
        .getElementById("maxCoinsWindowContainer")
        .classList.remove("active");

      addedToggle.checked = false;

      return;
    });

    const confirmButton = document.querySelector(".confirmButton");

    //Clear olds EventListeners
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    const newConfirm = document.querySelector(".confirmButton");

    newConfirm.addEventListener("click", () => {
      const selected = document.querySelector('input[name="toRemove"]:checked');

      if (!selected) {
        alert("Please select a coin to delete or cancel");
        return;
      }
      checkedCurrencies.splice(checkedCurrencies.indexOf(selected.value), 1);
      checkedCurrencies.push(addedCoin);
      saveData();

      //Untoggle deleted coin switch

      const toDeleteToggle = getToDeleteToggle(selected);
      toDeleteToggle.checked = false;

      document.querySelector(".overlay").classList.remove("active");
      document
        .getElementById("maxCoinsWindowContainer")
        .classList.remove("active");
    });
  }
  function displayMaxCoinsWindow(container, toAdd) {
    container.innerHTML = "";
    let radioHtml = "";

    document.getElementById("coinToAdd").textContent = `${toAdd}`;
    for (const currency of checkedCurrencies) {
      const coin = currencies.find((c) => c.symbol === currency.toLowerCase());

      radioHtml += `
     <div class="coinOption">
            <img src="${coin.image}" class="currencyImg" >
            <input type="radio" name="toRemove" value="${currency}">
            <label>${currency}</label>
        </div>
     `;
    }
    container.innerHTML = radioHtml;
  }

  function getToDeleteToggle(selected) {
    const selectedValue =
      typeof selected === "object" ? selected.value : selected;

    const symbolArr = Array.from(document.querySelectorAll(".symbolDiv"));
    const toDeleteSymbol = symbolArr.find(
      (element) => element.textContent === selectedValue
    );
    const toDeleteCardWrapper = toDeleteSymbol.closest(".cardWrapper");
    const toDeleteToggle = toDeleteCardWrapper.querySelector(".tgl-flat");
    return toDeleteToggle;
  }

  //handler for live report switch, more info button
  function cardEvents() {
    //Live Repport switch
    const toggles = document.querySelectorAll(".tgl-flat");
    toggles.forEach((toggle) => {
      toggle.addEventListener("change", (e) => {
        const isOn = e.target.checked;
        const currencyName = toggle
          .closest(".card")
          .querySelector(".symbolDiv");
        if (isOn) {
          if (checkedCurrencies.length === 5) {
            maxCoinsWindow(currencyName.textContent, toggle);
          } else {
            checkedCurrencies.push(currencyName.textContent);
            document.getElementById("clearCheckedButton").style.display =
              "block";

            saveData();
          }
        } else {
          const index = checkedCurrencies.indexOf(currencyName.textContent);
          checkedCurrencies.splice(index, 1);
          if (checkedCurrencies.length === 0)
            document.getElementById("clearCheckedButton").style.display =
              "none";
          saveData();
        }
      });
    });

    //More info button
    const wrappers = document.querySelectorAll(".cardWrapper");
    wrappers.forEach((wrapper) => {
      const showBtn = wrapper.querySelector(".showInfoButton");
      showBtn.addEventListener("click", async (e) => {
        const checkedCard = e.target.closest(".card");
        const currencyName = checkedCard.querySelector(".symbolDiv");

        //More info data fetching
        const moreInfoContainer = wrapper.querySelector(".moreInfo");
        const currencyId = wrapper.querySelector(".currencyId");

        try {
          const rates = await getRates(currencyId.textContent);
          moreInfoContainer.innerHTML = `
        $ ${rates.USD}<br>
        € ${rates.EUR}<br>
        ₪ ${rates.ILS}`;
        } catch (err) {
          alert(err.message);
        }

        //Show more info window
        wrapper.classList.toggle("open");
      });

      //Closing more info window
      const closeBtn = wrapper.querySelector(".closeInfoButton");
      closeBtn.addEventListener("click", (e) => {
        const checkedCard = e.target.closest(".card");
        const currencyName = checkedCard.querySelector(".symbolDiv");
        wrapper.classList.remove("open");
      });
    });
  }

  //Clear all checked card currencies
  function clearAllChecked() {
    if (checkedCurrencies.length === 0) {
      alert("No checked cards");
      return;
    }
    if (!confirm("Are you sure you want to clear all checked currency ?"))
      return;

    for (const currencies of checkedCurrencies) {
      getToDeleteToggle(currencies).checked = false;
    }
    checkedCurrencies.splice(0, checkedCurrencies.length);
    saveData();
    document.getElementById("clearCheckedButton").style.display = "none";
  }

  //Live reports functions

  function setGraph() {
    const ctx = document.getElementById("liveChart").getContext("2d");
    document.getElementById("liveChart").style.display = "block";

    const palette = ["#4caf50", "#2196f3", "#f44336", "#9c27b0", "#ff9800"];

    const datasets = checkedCurrencies.map((coin, i) => ({
      label: `${coin} (USD)`,
      data: [],
      borderColor: palette[i % palette.length],
      backgroundColor: "transparent",
      pointBackgroundColor: palette[i % palette.length],
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.3,
      borderWidth: 2,
      fill: false,
    }));

    const config = {
      type: "line",
      data: {
        labels: [], 
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "second",
              stepSize: 5,
              displayFormats: {
                second: "HH:mm:ss",
              },
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 12,
              color: "#888",
              font: { size: 11 },
            },
            grid: {
              color: "rgba(0,0,0,0.05)",
            },
            title: {
              display: true,
              text: "Time",
              color: "#555",
              font: { size: 12, weight: "500" },
            },
          },
          y: {
            title: {
              display: true,
              text: "Price (USD)",
              color: "#555",
              font: { size: 12, weight: "500" },
            },
            ticks: {
              color: "#888",
              font: { size: 11 },
            },
            grid: {
              color: "rgba(0,0,0,0.05)",
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#333",
              font: { size: 12, weight: "500" },
              usePointStyle: true,
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.7)",
            titleFont: { size: 13, weight: "600" },
            bodyFont: { size: 12 },
            padding: 8,
            cornerRadius: 4,
            mode: "nearest",
            intersect: false,
          },
        },
        layout: {
          padding: { top: 10, bottom: 10, left: 10, right: 10 },
        },
        animation: false,
        hover: {
          mode: "index",
          intersect: false,
        },
      },
    };

    return new Chart(ctx, config);
  }

  function liveReportGraph(chart) {
    setInterval(async () => {
      const now = new Date();
      chart.data.labels.push(now);

      try {
        const coins = await getLiveReports();

        Object.entries(coins).forEach(([symbol, info], i) => {
          if (chart.data.datasets[i]) {
            chart.data.datasets[i].data.push(info.USD);
          }
        });
      } catch (err) {
        console.warn("Live report fetch error:", err);
      }

      const maxPoints = 30;
      if (chart.data.labels.length > maxPoints) {
        chart.data.labels.shift();
        chart.data.datasets.forEach((ds) => ds.data.shift());
      }

      chart.update();
    }, 1000);
  }

  async function getLiveReports() {
    let urlConstr = "";

    for (let i = 0; i < checkedCurrencies.length; i++) {
      urlConstr += checkedCurrencies[i];
      if (i === checkedCurrencies.length - 1) break;
      urlConstr += ",";
    }

    const url =
      "https://min-api.cryptocompare.com/data/pricemulti?tsyms=usd&fsyms=" +
      urlConstr;
    const response = await fetch(url);
    const liveReport = await response.json();

    return liveReport;
  }

  function emptyListLiveReports() {
    const mainContainer = document.getElementById("liveReportContainer");
    const liveChart = document.getElementById("liveChart");

    let emptyListHtml = `<div class="emptyLiveReportText"> 
    Nothing to show. <br>
    Select coin(s) on home page to get live reports.
    </div>`;

    mainContainer.innerHTML = emptyListHtml;
  }

  function saveData() {
    sessionStorage.setItem(
      "checkedCurrencies",
      JSON.stringify(checkedCurrencies)
    );
    sessionStorage.setItem("currencies", JSON.stringify(currencies));
  }

  function loadData() {
    const jsonChecked = sessionStorage.getItem("checkedCurrencies");
    if (jsonChecked) {
      checkedCurrencies = JSON.parse(jsonChecked);
    }
    const jsonCurrencies = sessionStorage.getItem("currencies");
    if (jsonCurrencies) {
      currencies = JSON.parse(jsonCurrencies);
    }
  }

  function backgroundParallax() {
    const COIN_COUNT = 10;
    const coinContainer = document.getElementById("coin-bg");
    const coinSrc = "assets/imgs/fallingCoins.png";
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const coins = [];

    for (let i = 0; i < COIN_COUNT; i++) {
      const img = document.createElement("img");
      img.src = coinSrc;
      img.classList.add("coin");

      const x = Math.random() * vw;
      img.style.left = x + "px";

      const initY = Math.random() * vh;
      img.dataset.initY = initY;

      const speed = 5 + Math.random() * 10;
      img.dataset.speed = speed;

      const scale = 0.5 + Math.random() * 1.0;
      img.style.transform = `translateY(${initY}px) scale(${scale})`;

      coinContainer.appendChild(img);
      coins.push(img);
    }

    window.addEventListener("scroll", () => {
      const scrollY = window.scrollY;
      coins.forEach((coin) => {
        const speed = parseFloat(coin.dataset.speed);
        const initY = parseFloat(coin.dataset.initY);
        const scaleMatch = coin.style.transform.match(/scale\(([^)]+)\)/);
        const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

        const baseSize = 100;
        const coinH = baseSize * scale;

        let newY = initY + scrollY / speed;

        const cycle = vh + coinH;
        newY = (((newY % cycle) + cycle) % cycle) - coinH;

        coin.style.transform = `translateY(${newY}px) scale(${scale})`;
      });
    });

    window.addEventListener("resize", () => {
      const newVw = window.innerWidth;
      const newVh = window.innerHeight;
      coins.forEach((coin) => {
        let x = parseFloat(coin.style.left);
        if (x > newVw) x = Math.random() * newVw;
        coin.style.left = x + "px";

        coin.dataset.initY = Math.random() * newVh;
      });
    });
  }
})();
