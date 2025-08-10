const chromium = require('chrome-aws-lambda');

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
    browser = await chromium.puppeteer.launch({
      args: [...chromium.args, '--autoplay-policy=no-user-gesture-required'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // منع الصور والخطوط لتسريع التحميل
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'font'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    await page.goto(youtubeUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // البحث عن روابط HLS داخل الـ Network Requests
    const hlsUrl = await page.evaluate(() => {
      // طريقة 1: البحث في المتغيرات الجافاسكربت
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const match = script.textContent?.match(/"hlsManifestUrl":"([^"]+\.m3u8[^"]*)"/);
        if (match) return match[1].replace(/\\u0026/g, '&');
      }

      // طريقة 2: البحث في الـ ytInitialPlayerResponse
      if (window.ytInitialPlayerResponse?.streamingData?.hlsManifestUrl) {
        return window.ytInitialPlayerResponse.streamingData.hlsManifestUrl;
      }

      return null;
    });

    if (hlsUrl) {
      return {
        statusCode: 200,
        body: JSON.stringify({ hlsUrl: decodeURIComponent(hlsUrl) })
      };
    }

    // طريقة 3: البحث في Network tab كـ fallback
    const networkHls = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('.m3u8')) {
              resolve(entry.name);
              observer.disconnect();
              return;
            }
          }
        });
        observer.observe({ entryTypes: ['resource'] });
        
        // بعد 5 ثواني إذا لم يوجد شيء
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 5000);
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        hlsUrl: networkHls || "لم يتم العثور على رابط HLS" 
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
