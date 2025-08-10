const ytdlp = require('yt-dlp-exec');

exports.handler = async function(event, context) {
  const url = event.queryStringParameters?.url;
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url parameter' }),
    };
  }

  try {
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      noPlaylist: true,
    });

    if (!info.formats) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No formats found' }),
      };
    }

    const hlsFormat = info.formats.find(f => f.protocol === 'm3u8_native');
    if (hlsFormat) {
      return {
        statusCode: 200,
        body: JSON.stringify({ hls_url: hlsFormat.url }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No HLS m3u8 URL found' }),
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to extract stream info', details: error.message }),
    };
  }
};