# apirateLimiter
API LATE LIMITER 

API late Limiter service design.
Methods	Endpoints	Actions
GET	/api/v1/notification	     make notification requests and limit the requests
Setup
Install these two tools on your local machine
•	Redis server
•	Docker
Project installation
•	clone the repo: git clone https://github.com/aimeirak/apirateLimiter.git
•	switch to project directory : cd apiraleLimiter
•	install all required dependencies: npm install
•	start the server : npm run dev
all create docker image by running this command
docker build . –t rate-limiter-app

install Redis image in docker by running this command
docker pull redis
run in docker using docker compose
docker-compose up
Testing enpoints
Example
•	I am using Postman to do multiple requests or Insomnia
- Get: 
Request:
http://localhost:3000/api/v1/notification
 Response: 
 {
    "status": 200,
    "title": "notification",
    "message": "This is the test",
    "subscription": {
        "remaining_sec": 4,
        "remaining_per_month": 99
    }
}




