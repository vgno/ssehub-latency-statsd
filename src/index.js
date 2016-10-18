var Statsd = require('node-statsd');
var config = require('config');

var rabbitmq = require('./rabbitmq');
var EventSource = require('./EventSource');
var logger = require('./logger');

var statsdClient = new Statsd({
    host: config.statsd.host,
    port: config.statsd.port,
    prefix: config.statsd.prefix
});

(function () {
    var messages = {};

    rabbitmq(function(data) {
        var msg = JSON.parse(data.content.toString());

        if (!messages[msg.event]) {
            messages[msg.event] = {}
        }

        if (msg.id) {
            messages[msg.event][msg.id] = Date.now()
        }
    }).catch(function(err) {
        logger.error(err);
        process.exit(1);
    });

    var es = new EventSource(config.ssehub.url);
    es.addEventListener('message', function(data) {
        var msg = JSON.parse(data.msg.toString());

        if (messages[data.type]) {
            if (messages[data.type][data.id]) {
                 var diff = Date.now() - messages[data.type][data.id];

                 statsdClient.timing(data.type, diff);
                 logger.info(`[${data.type}] ${diff}ms`);

                 delete messages[data.type][data.id];
                 return;
            }
        }

        logger.warn(`[${data.type}] missing id ${data.id}`)
    });
})();