const puppeteer = require("puppeteer");
const fs = require("fs");

async function scrapeProduct(url, regionName) {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1920, height: 1080 },
  });
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForNavigation();

  // Клик на регион
  const regionSelector = await page.$(".FirstHeader_region__lHCGj");
  if (regionSelector) {
    await regionSelector.click();

    // Переход на окно со списком регионов
    const pages = await browser.pages();
    await pages[1].waitForSelector(".RegionModal_list__IzXxc", {
      visible: true,
    });
    await page.waitForXPath("//div");
    const region = await pages[1].$(".RegionModal_list__IzXxc");
    const [element] = await region.$x(`//div[contains(., '${regionName}')]`);
    if (element) {
      await element.click();
      await page.waitForTimeout(2000);
    }
  }

  // Получение информации о товаре
  const price = await page.$eval(".Price_price__B1Q8E", (el) => el.textContent);
  const rating = await page.$eval(
    ".Summary_itemContainer__HALgm",
    (el) => el.textContent
  );

  const reviews = await page.$eval(
    ".SimpleButton_regular__byc8S",
    (el) => el.textContent
  );

  const elementOldPrice = await page.$(".Price_role_old__qW2bx");
  let oldPrice;
  if (elementOldPrice) {
    oldPrice = await page.$eval(
      ".Price_role_old__qW2bx ",
      (el) => el.textContent
    );
    fs.writeFileSync(
      "product.txt",
      `price=${String(price).split(" ")[0].replace(/\,/g, ".")}\npriceOld=${
        oldPrice.split(" ")[0]
      }\nrating=${rating}\nreviewCount=${reviews.split(" ")[0]}`
    );
  } else {
    fs.writeFileSync(
      "product.txt",
      `price=${String(price)
        .split(" ")[0]
        .replace(/\,/g, ".")}\nrating=${rating}\nreviewCount=${
        reviews.split(" ")[0]
      }`
    );
  }

  // Создание скриншота страницы товара
  await page.screenshot({ path: "screenshot.jpg", fullPage: true });

  // Закрытие браузера
  await browser.close();
}

const url = process.argv[2];
const region = process.argv[3];
scrapeProduct(url, region);
