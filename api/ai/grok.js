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

      'https://blockrun.ai/api/v1/chat/completions',

      {
        model: "meta/llama-4-maverick",

        messages: [
          {
            role: "user",
            content: query
          }
        ]
      },

      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      }

    );


    res.json({

      status: true,

      response:
      response.data.choices[0].message.content

    });


  } catch (error) {

    console.error(
      'AI Error:',
      error.response?.data || error.message
    );


    res.status(500).json({

      status: false,

      error: "AI unavailable"

    });

  }

}


module.exports = {
  meta,
  onStart
};