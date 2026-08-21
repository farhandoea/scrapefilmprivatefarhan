const axios = require('axios');
async function testApi() {
  const url = 'https://sunapi.catchplay.com/graphql';
  try {
     const response = await axios.post(url, {
         query: `{ __schema { types { name } } }`
     }, {
         headers: {
            'Content-Type': 'application/json',
            'client-id': 'catchplay-web'
         },
         timeout: 5000
     });
     console.log("GraphQL response:", response.status);
  } catch(e) {
     console.log("Error:", e.message);
  }
}
testApi();
