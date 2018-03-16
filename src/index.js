const http = require('http');
const dotenv = require('dotenv');
const CachemanFile = require('cacheman-file');
dotenv.load();

var cache = new CachemanFile({});

// Initialize using verification token from environment variables
const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;
const { WebClient } = require('@slack/client');
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);
const port = process.env.PORT || 3000;

// Initialize an Express application
const express = require('express');
const bodyParser = require('body-parser');

const web = new WebClient(process.env.ACCESS_TOKEN);
const app = express();

// You must use a body parser for JSON before mounting the adapter
app.use(bodyParser.json());

// Mount the event handler on a route
// NOTE: you must mount to a path that matches the Request URL that was configured earlier
app.use('/slack/events', slackEvents.expressMiddleware());


const diaryMessage = `
Howdy! I see you've entered one of the *#diary* channels. Let me tell you what they are about!


During the day team updates what they are doing right now. When everyone are at the office it's easy to know what's going on, but when one of you is working remotely? Maybe EVERYONE works remotely?


This is where *#diary* helps.


Seeing what other are doing provide you an opportunity to react. You can help them by sharing knowledge on the topic, pair with them on interesting task. It also increases transparency within members which creates a trust amongst members.


You were absent for a week? *No problem*. You can *read the most important things* on the channel within minutes.
 
 PSST... please, *comment only via threads* to decrease the noise.
`;

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
slackEvents.on('member_joined_channel', (event)=> {
  console.log(`User ${event.user} joined channel`);

    cache.get(event.user, function (err, cachedUserID) {
        if (err) throw err;

        if (cachedUserID) {
           return;
        }

        web.channels.list()
            .then((res) => {
                const { name } = res.channels.find((channel) => {
                    return channel.id === event.channel
                });

                if (!name.endsWith('diary')) {
                    return;
                }

                const messageOptions = {
                    channel: event.user, text: diaryMessage, as_user: true, username: 'Diary Buddy'
                };

                return web.chat.postMessage(messageOptions)
            })
            .then(() => {
                cache.set(event.user, { visited: Date.now() }, Number.MAX_VALUE, function (err) {
                    if (err) throw err;
                });

                console.log('Message sent!');
            })
            .catch(console.error);
    });
});

// Handle errors (see `errorCodes` export)
slackEvents.on('error', console.error);

// Start the express application
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});
