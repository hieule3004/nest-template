import { HttpClient } from './http';

const client = new HttpClient();

client.get({
  method: 'GET',
  url: 'https://www.dbs.com.sg/sg-rates-api/v1/api/sgrates/getCurrencyConversionRates',
  callback: (content) => {
    const {
      currency,
      baseCurrencyUnit,
      ttInverseBuy,
      quoteCurrency,
      quoteCurrencyUnit,
      ttSell,
    } = JSON.parse(content).results.assets[0].recData.filter(
      (o: any) => o.currency === 'VND' && o.quoteCurrency === 'SGD',
    )[0];

    const mTo = 1;
    const to = parseFloat(baseCurrencyUnit) * parseFloat(ttInverseBuy);
    console.log(`${mTo} ${quoteCurrency} = ${mTo * to} ${currency}`);

    const mFrom = 1;
    const from = parseFloat(quoteCurrencyUnit) * parseFloat(ttSell);
    console.log(`${mFrom} ${currency} = ${mFrom * from} ${quoteCurrency}`);
  },
});
