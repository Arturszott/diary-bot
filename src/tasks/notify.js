
'use strict'

const _ = require('lodash')
const config = require('../config')
const trending = require('github-trending')
const Botkit = require('botkit')

var controller = Botkit.slackbot({})
var bot = controller.spawn()

bot.configureIncomingWebhook({ url: config('WEBHOOK_URL') })

const msgDefaults = {
  response_type: 'in_channel',
  username: 'Starbot',
  icon_emoji: config('ICON_EMOJI')
};

let msg = _.defaults({ attachments: attachments }, msgDefaults)

bot.sendWebhook({
  text: 'test'
}, (err, res) => {
  if (err) throw err
  console.log(msg);
  console.log(`\n🚀  Starbot report delivered 🚀`)
})