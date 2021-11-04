import moment from 'moment';
import redis from 'redis';
import { getRequestsMadeInMonth, getAllowedRequestsInMonth, getMaxRequestsPerSec, getMaxRequestsPerMonth } from '../database/user';
import dotenv from 'dotenv';
 
dotenv.config();
 
let MAX_REQUESTS_PER_SEC ;
let MAX_REQUESTS_PER_MONTH ;
const WINDOW_SIZE_IN_MILLISECOND = 1000;
const WINDOW_LOG_INTERVAL_IN_MILLISECOND = 500;
 
const initializeConstants = async() => {
 MAX_REQUESTS_PER_SEC = await getMaxRequestsPerSec('::1') || process.env.REQUESTS_ALLOWED_PER_SEC;
 MAX_REQUESTS_PER_MONTH = await getMaxRequestsPerMonth('::1') || process.env.REQUESTS_ALLOWED_PER_MONTH
}
const redisClient = redis.createClient();
let exceededMonthlyLimit;
 
const createRedisRecord = (requestIp) => {
 const newRecord = [];
 const requestLog = {
   requestTimeStamp: moment().unix(),
   requestCount: 1,
 };
 newRecord.push(requestLog);
 redisClient.set(requestIp, JSON.stringify(newRecord));
};

const getRequestsWithinWindow = (record, requestIp) => {
 const windowStartTimeStamp = moment()
   .subtract(WINDOW_SIZE_IN_MILLISECOND, 'milliseconds')
   .unix();
 const requestsWithinWindow = record.filter(
   (request) => {
     const isInWindowSize = request.requestTimeStamp > windowStartTimeStamp;
     if (isInWindowSize) return request;
   },
 );
 return requestsWithinWindow;
};
const getRequestsOutsideWindow = (record) => {
 const windowStartTimeStamp = moment()
   .subtract(WINDOW_SIZE_IN_MILLISECOND, 'milliseconds')
   .unix();
 const requestsToBeQueued = record.filter(
   (request) => !(request.requestTimeStamp > windowStartTimeStamp),
 );
 return requestsToBeQueued;
};
 
const getNumberOfRequestsMadeWithinWindowSize = (requestsWithinWindow) => {
 const totalRequests = requestsWithinWindow.reduce(
   (accumulator, request) => accumulator + request.requestCount,
   0,
 );
 return totalRequests;
};

const handleMonthlyRequests = async (requestIp, requestsWithinWindowSizeCount, res) => {
  const numberOfRequestsMadeThisMonth = await getRequestsMadeInMonth(requestIp);
  const numberOfRequestsThisMonthAfterThisWindow = await numberOfRequestsMadeThisMonth + await requestsWithinWindowSizeCount;
  const allowedRequestsPerMonth = await getAllowedRequestsInMonth(requestIp);
  const isInMonthlyLimit = numberOfRequestsThisMonthAfterThisWindow < allowedRequestsPerMonth;

  exceededMonthlyLimit = numberOfRequestsMadeThisMonth >= allowedRequestsPerMonth;
  if (exceededMonthlyLimit) {
    return res.status(429).send({
      error: `You have exceeded the allowed ${MAX_REQUESTS_PER_MONTH} requests per month. Upgrade for more requests/month`,
    });
  }
  if (!isInMonthlyLimit) {
    const remainedRequestsThisMonthCount = allowedRequestsPerMonth - numberOfRequestsMadeThisMonth;

    if (remainedRequestsThisMonthCount < 1) {
      return res.status(429).send({
        error: `You have exceeded the allowed ${MAX_REQUESTS_PER_MONTH
        } requests per month. Upgrade for more requests/month`,
      });
    }
    const pendingRequests = redisClient.get(requestIp);
    if (pendingRequests.length <= remainedRequestsThisMonthCount) return null;
    if (remainedRequestsThisMonthCount > 0) {
      const remainedRequestsThisMonth = [];
      for (let index = 0; index < remainedRequestsThisMonthCount; index += 1) {
        remainedRequestsThisMonth.push(pendingRequests[index]);
      }
      return remainedRequestsThisMonth;
    }
  }
};

const rateLimiter = (req, res, next) => {
 try {
   initializeConstants();
   if (!redisClient) throw new Error('Redis client not found.');
   if (!redisClient.connected) throw new Error('Redis client not connected.');
   redisClient.get(req.ip, (error, record) => {
     if (error) throw new Error('Error getting redis log record.');
     else if (!record) {
       createRedisRecord(req.ip);
       next();
     } else {
       const parsedRecord = JSON.parse(record);
       const requestsWithinWindow = getRequestsWithinWindow(parsedRecord, req.ip);
       const requestsWithinWindowSizeCount = getNumberOfRequestsMadeWithinWindowSize(requestsWithinWindow);
 
       // handle requests that bleached the limits
       if (requestsWithinWindowSizeCount >= MAX_REQUESTS_PER_SEC) {
         return res.status(429).send({
           error: `You have exceeded the allowed ${MAX_REQUESTS_PER_SEC} requests per second. Upgrade for more requests/sec`,
         });
       }
       const remainedRequestsThisMonth = handleMonthlyRequests(req.ip, requestsWithinWindowSizeCount, res);

       // Check whether each request is in the current window size
       const lastRequestLog = parsedRecord[parsedRecord.length - 1];
       const currentWindowIntervalStartTimeStamp = moment()
         .subtract(WINDOW_LOG_INTERVAL_IN_MILLISECOND, 'milliseconds')
         .unix();
       // if we still in the window size increment the counter
       if (
         lastRequestLog.requestTimeStamp
           > currentWindowIntervalStartTimeStamp
       ) {
         lastRequestLog.requestCount += 1;
         parsedRecord[parsedRecord.length - 1] = lastRequestLog;
       } else {
         parsedRecord.push({
           requestTimeStamp: moment().unix(),
           requestCount: 1,
         });
       }
       if (remainedRequestsThisMonth) {
        redisClient.set(req.ip, JSON.stringify(remainedRequestsThisMonth));
      }
       redisClient.set(req.ip, JSON.stringify(parsedRecord));
       req.requestsWithinWindowSizeCount = requestsWithinWindowSizeCount;
       if (!exceededMonthlyLimit) next();
     }
   });
 } catch (error) {
   res.send({ error });
 }
};
export default rateLimiter;