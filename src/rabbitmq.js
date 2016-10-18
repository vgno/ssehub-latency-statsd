var config = require('config');
var amqplib = require('amqplib');
var logger = require('./logger');

module.exports = onMessage => {
    if (!config.amqp) {
        return Promise.resolve();
    }

    return amqplib.connect(config.amqp.url).then(function(connection) {
        return connection.createChannel().then(function(channel) {
            return Promise.all([
                channel.assertExchange(config.amqp.exchange.name, config.amqp.exchange.type, config.amqp.exchange.options),
                channel.assertQueue(config.amqp.queue.name, config.amqp.queue.options),
                channel.bindQueue(config.amqp.queue.name, config.amqp.exchange.name)
            ]).then(function() {
                channel.consume(config.amqp.queue.name, onMessage, { noAck: true });

                logger.info('SSEHub: Connected to %s Exchange: %s', config.amqp.url, config.amqp.exchange.name);
            });
        })
    });
};