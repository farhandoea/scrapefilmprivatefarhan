const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.netflix.com/tudum/top10/');
  await page.waitForSelector('button');
  
  // Find category dropdown or links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('top10'));
  });
  console.log('Links:', [...new Set(links)]);
  
  // Also check buttons
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.innerText);
  });
  console.log('Buttons:', buttons);
  
  await browser.close();
})();
