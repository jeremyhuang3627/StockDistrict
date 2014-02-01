var ids = {
facebook: {
 clientID: '645410662189336',
 clientSecret: '1d544e116744a40d524ae8511a458195',
 callbackURL: 'http://localhost:3000/auth/facebook/callback'
},
twitter: {
 consumerKey: 'NXq8a04wTSAswADFbKPUg',
 consumerSecret: 'xzMdXdlVEyZq20oTkYzA0qECtFNRzKSRMf5Y9XH6J9w',
 callbackURL: "http://localhost:3000/auth/twitter/callback"
},
linkedin: {
 userToken: '7b4710a0-f676-41a8-afe6-0ccdb2d8338d',
 userSecret: '2bcd1d73-8a32-41da-b0a5-491873af28ae',
 callbackURL: "http://localhost:3000/auth/linkedin/callback"
},
google: {
 returnURL: 'http://localhost:3000/auth/google/callback',
 realm: 'http://localhost:3000'
}
}

module.exports = ids