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

    let response;


    try {

      response = await axios({

        method: 'PUT',

        url:
        'https://promplate-api.free-chat.asia/please-do-not-hack-this/single/chat_messages',

        data: {

          messages: [
            {
              role: "user",
              content: query
            }
          ],

          model: "grok-2-1212",

          temperature: 0.7

        },

        headers: {

          'Content-Type':
          'application/json',

          'User-Agent':
          'Mozilla/5.0'

        },

        timeout: 15000

      });


    } catch (e) {


      response = await axios.post(

        'https://api.deepenglish.com/api/gpt_open_ai/chatnew',

        {

          messages: [
            {
              role: "user",
              content: query
            }
          ],

          projectName: "wordpress",

          temperature: 0.9

        },

        {

          headers: {

            'Content-Type':
            'application/json',

            'Authorization':
            'Bearer UFkOfJaclj61OxoD7MnQknU1S2XwNdXMuSZA+EZGLkc='

          }

        }

      );

    }



    res.json({

      status: true,

      response:
      response.data.message ||
      response.data.choices?.[0]?.message?.content ||
      response.data

    });



  } catch (error) {


    console.error(
      "FULL ERROR:",
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