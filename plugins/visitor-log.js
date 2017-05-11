const request = require('request')
const moment = require('moment')
const _ = require('lodash')
const chrono = require('chrono-node')
const visitorLogDateUrl = 'http://www.politico.com/interactives/databases/trump-white-house-visitor-logs-and-records/api/date'
const visitorsCache = new Map()
const visitorLogBaseUrl = 'https://datalab.politico.com/databases/white-house-visitor-logs/api'


module.exports = {
  init: (controller) => {
    controller.hears([/^wdt (.*)$/i, /^who did (Donald )?Trump meet with (.*)/i], ['direct_message', 'direct_mention'], meetWho)
    controller.hears([/^who is (.*)$/], ['direct_message', 'direct_mention'], whoIs)
    controller.hears([/^sources(\?)?$/], ['direct_message', 'direct_mention'], sources)
  },
  help: {
    command: 'visitor log',
    text: ({ botName }) => {
      return `To learn who Donald Trump has been meeting with, ask: \`@${botName} who did Donald Trump meet with today\`. You can replace "today" with any date and I'll do my best to find some meetings for that day. 
Curious who someone is? Ask \`@${botName} who is {person}\` and I'll let you know.
Want to know where my data is coming from? Ask \`@${botName} sources\``
    }
  }
}

function meetWho(bot, message) {
  const chronoResults = chrono.parse(message.match[2])
  const chronoDate = moment(chronoResults[0].start.date())
  const queryDate = chronoDate.format('YYYY-MM-DD')
  const prettyDate = chronoDate.format('ll')

  request({
    method: 'GET',
    url: `${visitorLogDateUrl}/${queryDate}.json`,
    json: true
  }, (err, res, body) => {
    if (err || (res.statusCode >= 400 && res.statusCode !== 404)) {
      return bot.reply(message, `Hmm. I'm having a little trouble looking for those meetings. Give me a minute and try again.`)
    }

    if (res.statusCode === 404) {
      return bot.reply(message, `I couldn't find any records of meetings on ${prettyDate}.`);
    }

    const meetings = _.reduce(body, (phrase, meeting) => {
      const visitor = meeting.visitor;
      const visitorName = `${visitor.first_name} ${visitor.last_name}`
      let newPhrase = `${phrase}\r\n${visitorName}`

      if (visitor.title) {
        newPhrase += `, ${visitor.title}`
      }

      visitorsCache.set(visitorName.toLowerCase(), visitor.slug)

      return newPhrase
    }, ``)

    return bot.reply(message, `On ${prettyDate} Donald Trump met or spoke with:${meetings}`)
  })
}

function whoIs(bot, message) {
  const person = message.match[1];
  const slug = visitorsCache.get(person.toLowerCase())

  // this seems not that useful
  request({
    method: 'GET',
    url: `${visitorLogBaseUrl}/visitors/${slug}`,
    headers: {
      Authorization: process.env.POLITICO_VISITOR_LOGS_KEY
    },
    json: true
  }, (err, res, body) => {
    console.log(body);
  })
}

function sources(bot, message) {
  bot.reply(message, `Visitor log data provided by https://datalab.politico.com/databases/white-house-visitor-logs/api/docs/`);
}