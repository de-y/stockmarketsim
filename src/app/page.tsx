'use client';
import '@/css/stonk.css'
import useLocalStorage from "use-local-storage";
import { getCookie, setCookie } from 'cookies-next';
import { db } from '@/db';
import { useEffect, useState } from 'react';

export default function Home() {
  const [cash, setCash] = useLocalStorage("cash", 1000.00);
  if (cash == null || Number.isNaN(cash)) {
    setCash(1000.00);
  }
  const [localCurrency, setLocalCurrency] = useLocalStorage("currency", "USD");
  const [loading, setLoading] = useState(true);
  const [stocks_data, setStocksData] = useState([]);

  function buyStock() {
    // @ts-ignore
    let ticker = document.getElementById('ticker-buy').value;
    // @ts-ignore
    let quantity = document.getElementById('quantity-buy').value;
    let stockInfo;

    fetch('/api/get_stocks', { method: 'POST', body: JSON.stringify({'ticker': ticker}) }).then(r => r.json().then(data => {
      stockInfo = data.stock_information;
      console.log(stockInfo);
      let price = parseFloat(stockInfo['05. price']);
      if ((price * quantity) > cash) {
        alert(`Insufficent funds to buy ${quantity} of ${ticker} at ${price} individually for a total of ${price * quantity}`);
        return;
      }
      setCash(cash - (price * quantity));
      let portfolio = getCookie('portfolio');
      db.collection('portfolio').add({
        ticker: ticker,
        quantity: quantity,
        initPrice: price
      });
    }))
  }
  function searchStock() {
    // @ts-ignore
    let ticker = document.getElementById('ticker-search').value;
    let stockInfo;
    fetch('/api/get_stocks', { method: 'POST', body: JSON.stringify({'ticker': ticker}) }).then(r => r.json().then(data => {
      stockInfo = data.stock_information;
      console.log(stockInfo);
      // @ts-ignore
      document.getElementById('stock-search-ticker').innerText = stockInfo['01. symbol'];
      // @ts-ignore
      document.getElementById('stock-search-price').innerText = stockInfo['05. price'] + ' ' + localCurrency;
    }))
  }
  function sellStock() {
    // @ts-ignore
    let ticker = document.getElementById('ticker-sell').value;
    // @ts-ignore
    let quantity = document.getElementById('quantity-sell').value;
    let stockInfo;

    if (quantity < 0) {
      alert('You do not own this stock.')
      return;
    }

    fetch('/api/get_stocks', { method: 'POST', body: JSON.stringify({'ticker': ticker}) }).then(r => r.json().then(data => {
      stockInfo = data.stock_information;
      let price = parseFloat(stockInfo['05. price']);
      setCash(cash + (price * quantity));
      db.collection('portfolio').doc({ticker: ticker}).delete();      
    }))
  }
  useEffect(() => {
    // @ts-ignore
    db.collection('portfolio').get().then(data => {
      setStocksData(data);
      setLoading(false);
    })
  }, [])
  return (
    <>
      <div className='container'>
        <div className='summative'>
          <h1>Stockr: A simple stock market simulator</h1>
          <p>Current balance: {cash} {localCurrency}</p>
        </div>
        <div className='summative'>
          <h2>Stock Market</h2>
          <div className='stocks'>
            <p>Owned Stocks</p>
            <p>Please note that stats are not real-time and may be delayed.</p>
            {loading ? <p>Loading...</p> : (<>{stocks_data.map(stock => {
              return (
                <div className='stock' key={stock}>
                  {/* @ts-ignore */}
                  <p key={stock}>Ticker: {stock.ticker}</p>
                  {/* @ts-ignore */}
                  <p key={stock}>Quantity: {stock.quantity}</p>
                  {/* @ts-ignore */}
                  <p key={stock}>Price Bought:  {stock.initPrice}</p>
                </div>
              )
            })}</>)}
          </div>
          <div className='buy'>
            <p>Search Stocks</p>
            <input type='text' placeholder='Ticker' id='ticker-search'/>
            <button onClick={searchStock}>Search</button>
            <p>Stock Information</p>
            <div className='stock'>
              <p id="stock-search-ticker">Stock</p>
              <p id="stock-search-price" className='price'>Price</p>
            </div>
          </div>
          <div className='buy'>
            <h1>Buy</h1>
            <input type='text' placeholder='Ticker' id='ticker-buy'/>
            <input type='number' placeholder='Quantity' id='quantity-buy'/>
            <button onClick={buyStock}>Buy</button>
          </div>
          <div className='sell'>
            <h1>Sell</h1>
            <input type='text' placeholder='Ticker' id='ticker-sell'/>
            <input type='number' placeholder='Quantity' id='quantity-sell'/>
            <button onClick={sellStock}>Sell</button>
          </div>
        </div>
      </div>
    </>
  );
}
