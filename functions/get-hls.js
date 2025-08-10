const axios = require('axios');

exports.handler = async (event) => {
  try {
    const youtubeUrl = event.queryStringParameters.url;
    
    if (!youtubeUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "يجب تقديم رابط URL" })
      };
    }

    // جلب محتوى HTML مع محاكاة متصفح حقيقي
    const response = await axios.get(youtubeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    // إرجاع HTML الخام كما هو
    return {
      statusCode: 200,
      body: response.data
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "فشل في جلب HTML",
        details: error.message
      })
    };
  }
};