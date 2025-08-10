const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async (event) => {
  try {
    // 1. الحصول على رابط اليوتيوب من الطلب
    const youtubeUrl = decodeURIComponent(event.queryStringParameters.url);
    
    if (!youtubeUrl.includes('youtube.com')) {
      return { statusCode: 400, body: JSON.stringify({ error: "رابط يوتيوب غير صالح" }) };
    }

    // 2. جلب HTML الخام مع محاكاة متصفح حقيقي
    const response = await axios.get(youtubeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = response.data;

    // 3. تنظيف HTML بنفس طريقة الجافا
    const cleanHtml = html
      .replace(/\\u003C/g, '<')
      .replace(/\\n/g, '')
      .replace(/\\"/g, '"');

    // 4. البحث عن رابط HLS بنفس Regex الجافا
    const hlsPattern = /(https:\/\/manifest\.googlevideo\.com\/[^\s"']+index\.m3u8)/;
    const hlsMatch = cleanHtml.match(hlsPattern);

    if (hlsMatch) {
      const hlsUrl = hlsMatch[1].replace(/\\u0026/g, '&');
      return { statusCode: 200, body: JSON.stringify({ hlsUrl }) };
    }

    return { statusCode: 404, body: JSON.stringify({ error: "لم يتم العثور على رابط HLS" }) };
    
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ 
      error: "حدث خطأ",
      details: error.message 
    }) };
  }
};