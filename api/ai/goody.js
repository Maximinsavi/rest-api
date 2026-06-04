const axios = require('axios');

const meta = {
  name: 'GPT Vision Image',
  path: '/ai?prompt=&uid=',
  method: 'get',
  category: 'ai'
};


async function onStart({ req, res }) {

  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({
      error: "prompt required"
    });
  }


  try {

    const response = await axios.post(

      'https://api.openai.com/v1/responses',

      {
        model: "gpt-4.1",

        input: prompt,

        tools: [
          {
            type: "image_generation"
          }
        ]
      },

      {
        headers: {

          Authorization:
          `Bearer ${process.env.sk-abcdef1234567890abcdef1234567890abcdef12}`,

          'Content-Type':
          'application/json'

        }
      }

    );


    res.json({

      status:true,

      response: response.data

    });


  } catch(e) {

    console.log(
      e.response?.data || e.message
    );

    res.status(500).json({

      status:false,

      error:"AI error"

    });

  }

}


module.exports = {
  meta,
  onStart
};