NotificationApp
Notification service design.

Documentation
Methods	Endpoints	Actions
GET	/api/notifications	make notification requests
POST	/api/notifications/renew	create/update client subscriptions
Setup
Install these two tools on your local machine
Redis server
MongoDb
Project installation
clone the repo: git clone cd https://github.com/T2Wil/NotificationApp.git
switch to project directory : cd NotificationApp
install all required dependencies: npm install
start the server : npm run dev
Testing enpoints
npm test

Examples
I am using Postman to do multiple requests(postman runner)
- Get notifications: 
Request: localhost:3000/api/notifications
 Response: 
 {
    "status": 200,
    "title": "important communication",
    "content": "Urgent meeting on Friday",
    "subscription": {
        "maxRequestsPerSec": 4,
        "maxRequestsPerMonth": 100
    }
}

- POST notifications/renew: This endpoint is for updating/upgrading the client with new subscription
If passed with empty request body, It updates the client with `.env` default values.

Request: localhost:3000/api/notifications/renew
Response: {
    "status": 200,
    "message": "Renewed with success.",
    "user": {
        "maxRequestsPerSec": 4,
        "maxRequestsPerMonth": 100,
        "requestsMadeInMonth": 1
    }
}

If passed with request body, It updates the client and overrides all clients defaults subscription.

Request: localhost:3000/api/notifications/renew
    {
        "maxRequestsPerSec": 3,
        "maxRequestsPerMonth": 50
    }
    
 Response: {
    "status": 200,
    "message": "Renewed with success.",
    "user": {
        "maxRequestsPerSec": 3,
        "maxRequestsPerMonth": 50,
        "requestsMadeInMonth": 1
    }
}
