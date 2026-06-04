const axios = require('axios');

const meta = {
  name: 'image',
  path: '/image?prompt=cat',
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


    const response = await axios.get(

      'https://image.pollinations.ai/prompt/' +
      encodeURIComponent(prompt),

      {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent':'Mozilla/5.0'
        }
      }

    );


    res.set(
      'Content-Type',
      'image/png'
    );


    res.send(response.data);



  } catch(e) {


    res.status(500).json({

      status:false,

      error:"Image generation failed"

    });


  }

}


module.exports = {
  meta,
  onStart
};