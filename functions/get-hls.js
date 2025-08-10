const axios = require("axios");
const cheerio = require("cheerio");

exports.handler = async (event, context) => {
  try {
    const youtubeUrl = event.queryStringParameters.url;

    if (!youtubeUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "يجب إدخال رابط يوتيوب" }),
      };
    }

    const response = await axios.get(youtubeUrl);
    const html = response.data;
    const hlsMatch = html.match(/"hlsManifestUrl":"(https:\/\/[^"]+\.m3u8)"/);

    if (hlsMatch && hlsMatch[1]) {
      const hlsUrl = hlsMatch[1].replace(/\\\//g, "/");
      return {
        statusCode: 200,
        body: JSON.stringify({ hlsUrl }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "لم يتم العثور على رابط HLS" }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "حدث خطأ: " + error.message }),
    };
  }
};