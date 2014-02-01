var ids = {
facebook: {
 clientID: '645410662189336',
 clientSecret: '1d544e116744a40d524ae8511a458195',
 callbackURL: 'http://localhost:3000/auth/facebook/callback'
},
twitter: {
 consumerKey: 'get_your_own',
 consumerSecret: 'get_your_own',
 callbackURL: "http://localhost:3000/auth/twitter/callback"
},
github: {
 clientID: 'get_your_own',
 clientSecret: 'get_your_own',
 callbackURL: "http://localhost:3000/auth/github/callback"
},
google: {
 returnURL: 'http://localhost:3000/auth/google/callback',
 realm: 'http://localhost:3000'
}
}

module.exports = ids