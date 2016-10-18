module.exports = require('bunyan').createLogger({
    name: require('../package.json').name,
    level: process.env.LOG_LEVEL || 'info'
});