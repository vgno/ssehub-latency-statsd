const co = require('co');
const config = require('config');
const amqplib = require('amqplib');
const logger = require('./logger');

module.exports = onMessage => co(function *() {
    if (!config.amqp) {
        return Promise.resolve();
    }

    const connection = yield amqplib.connect(config.amqp.url);
    const channel = yield connection.createChannel();

    yield Promise.all([
        channel.assertExchange(config.amqp.exchange.name, config.amqp.exchange.type, config.amqp.exchange.options),
        channel.assertQueue(config.amqp.queue.name, config.amqp.queue.options),
    ]);

    yield channel.bindQueue(config.amqp.queue.name, config.amqp.exchange.name);

    channel.consume(config.amqp.queue.name, onMessage, { noAck: true });

    logger.info('SSEHub: Connected to %s Exchange: %s', config.amqp.url, config.amqp.exchange.name);
});