const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

exports.handler = async (event) => {
  const youtubeUrl = event.queryStringParameters?.url;

  if (!youtubeUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "يجب تقديم رابط URL" })
    };
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(youtubeUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const hlsUrl = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const match = script.textContent?.match(/"hlsManifestUrl":"([^"]+\.m3u8[^"]*)"/);
        if (match) return match[1].replace(/\\u0026/g, '&');
      }

      if (window.ytInitialPlayerResponse?.streamingData?.hlsManifestUrl) {
        return window.ytInitialPlayerResponse.streamingData.hlsManifestUrl;
      }

      return null;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        hlsUrl: hlsUrl || "لم يتم العثور على رابط HLS"
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "فشل في استخراج رابط HLS",
        details: error.message
      })
    };
  } finally {
    if (browser) await browser.close();
  }
};
