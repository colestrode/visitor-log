require('skellington')({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  port: process.env.PORT,
  plugins: [
    require('./plugins/visitor-log')
  ],
  scopes: ['bot', 'channels:history', 'groups:history', 'im:history', 'mpim:history'],
  startRtm: false,
  botkit: {
    debug: true,
    json_file_store: './db'
  }
  // TODO need successRedirect and errorRedirect pages, maybe a github wiki or something
})