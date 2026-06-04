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

    const response = await axios.post(

      'https://torgpt.space/api/v1/chat',

      {
        message: query
      },

      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
          'Mozilla/5.0'
        }
      }

    );


    res.json({

      status: true,

      response:
      response.data.message ||
      response.data.response ||
      response.data

    });


  } catch (error) {

    console.error(
      'TorGPT Error:',
      error.response?.data || error.message
    );


    res.status(500).json({

      status: false,

      error: 'Failed to get response. ...'

    });

  }

}


module.exports = {
  meta,
  onStart
};