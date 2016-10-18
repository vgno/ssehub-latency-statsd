var Statsd = require('node-statsd');
const config = require('config');
const co = require('co');

const rabbitmq = require('./rabbitmq');
const EventSource = require('./EventSource');
const logger = require('./logger');

const statsdClient = new Statsd({
    host: config.statsd.host,
    port: config.statsd.port,
    prefix: config.statsd.prefix
});

co(function *() {
    const messages = {};

    yield rabbitmq(data => {
        const msg = JSON.parse(data.content.toString());

        if (!messages[msg.event]) {
            messages[msg.event] = {}
        }

        if (msg.id) {
            messages[msg.event][msg.id] = Date.now()
        }
    }).catch(err => {
        logger.error(err);
        process.exit(1);
    });

    const es = new EventSource(config.ssehub.url);
    es.addEventListener('message', data => {
        const msg = JSON.parse(data.msg.toString());

        if (messages[data.type]) {
            if (messages[data.type][data.id]) {
                 const diff = Date.now() - messages[data.type][data.id]

                 statsdClient.timing(data.type, diff);
                 logger.info(`[${data.type}] ${diff}ms`);
                 return;
            }
        }

        logger.warn(`[${data.type}] missing id ${data.id}`)
    }).catch(err => {
        logger.error(err);
        process.exit(1);
    });
});