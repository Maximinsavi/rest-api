const axios = require('axios');

const meta = {
  name: 'Grok',
  path: '/grok?query=hi',
  method: 'get',
  category: 'ai'
};


async function onStart({ req, res }) {

  const { query } = req.query;


  if (!query) {
    return res.status(400).json({
      error: 'The "query" param is required'
    });
  }


  try {

    const response = await axios.get(
      'https://itzpire.com/api/ai/gpt',
      {
        params: {
          q: query
        },
        headers: {
          'User-Agent':
          'Mozilla/5.0'
        }
      }
    );


    res.json({
      status: true,
      response:
      response.data.result || response.data
    });


  } catch (error) {

    console.error(
      'AI Error:',
      error.response?.data || error.message
    );


    res.status(500).json({
      status: false,
      error: 'Failed to get response'
    });

  }

}


module.exports = {
  meta,
  onStart
};