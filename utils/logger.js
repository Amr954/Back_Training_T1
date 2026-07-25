const {format , createLogger , transports} = require('winston')
const {timestamp , combine , printf , errors , json} = format

const logFormat = printf(({level, message, timestamp , stack})=>{
    let logMesage = `${timestamp} | ${level.toLocaleUpperCase()} | ${stack || (typeof message == 'object' ? JSON.stringify(message) : message)}`;
    return logMesage
});

const getLogger = (filename) =>{
    const loggerTransports = [
        new transports.Console(),
    ];
    if(process.env.NODE_ENV !== 'production'){
        loggerTransports.push(
            new transports.File({filename: `./logs/${filename}.log`}),
            new transports.File({filename: `./logs/all.log`}),
        )
    }
    return createLogger({
        format: combine(
            timestamp({format : 'YYYY-MM-DD HH-mm-ss'}),
            errors({stack : true}),
            json(),
            logFormat
        ),
        transports:loggerTransports
    });
};

module.exports = getLogger