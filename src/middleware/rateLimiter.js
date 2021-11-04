import redis from 'redis';
import userNotificationController from '../controller/userNotificationController.js';
import moment from 'moment';
import util from 'util';

import dotenv from 'dotenv';
 
const client = redis.createClient({host: 'redis',port:6379});
client.get = util.promisify(client.get);

//default structure
client.set('requests', JSON.stringify({}))

client.on("error", function(error) {
    console.error(error);
  });

// requests per second 5
// requests per month 100
/**
 * {Ip: 127.0.0.1, req_per_sec: 5, req_per_month: 100}
 */
 const rateLimiter= async (req, res,next) => { 
    // get user Ip
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;


    //check if user ip in redis
    let user = null;
    let requests = {};
    let raw_requests = await client.get('requests');
    requests = JSON.parse(raw_requests);
    user = requests[ip] !== undefined ? requests[ip] : null;

    if (user === null) {
        console.log('No user found')
        const default_requests_per_sec = parseInt(process.env.default_requests_per_sec);
        const default_requests_per_month = parseInt(process.env.default_requests_per_month);
        requests[ip] = {
            "req_per_sec": default_requests_per_sec, 
            "req_per_month": default_requests_per_month
        }
        await client.set("requests", JSON.stringify(requests));
        console.log('saved user');
        console.log(await client.get('requests'));
        res.send(`you still have requests left: sec:${default_requests_per_sec} , monthly: ${default_requests_per_month} !`);
        return
    } 
    // ngeze ahangaha
    else {
        console.log('user found')
        var millisecondsToWait = 5000;
        if(user.req_per_sec <= 0) {       
            res.send("Your requests per second are done, please try again in one second")
           
            setTimeout(function() {
                //  refresh redis after request limit
                client.set('requests', JSON.stringify({"req_per_sec":5,req_per_month:user.req_per_month}))
            }, millisecondsToWait);
            return;

        } else if (user.req_per_month <= 0) {
            res.send("Your requests per months are done, please try again in one month");
            return;
        } else {
            requests[ip] = {
                "req_per_sec": user.req_per_sec -1,
                "req_per_month": user.req_per_month - 1
            }

            client.set('requests', JSON.stringify(requests));
            res.send(`you still have requests left: sec:${user.req_per_sec} , monthly: ${user.req_per_month} !`)
        }
    }
    
}

// timers

//  setTimeout(async() => {
//     let all_raw_requests = await client.get('requests');
//     let all_requests = JSON.parse(all_raw_requests);
    
//      all_requests = all_requests.map((rs) => {
//         rs.req_per_sec = 5;
//     })

//     console.log('Per second reset')
// }, 1500);

export default  rateLimiter;