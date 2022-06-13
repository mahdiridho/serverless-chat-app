# serverless-chat-app
AWS Serverless based chat app demo, build with appycloud. It uses [appycloud realtime db architecture](https://docs.appycloud.tech/content/appycloud-db/index.html#2)

## Installation & Run the Apps

First of all, deploy the backend stuff on appycloud. Once it's done, let create the initial configuration by running this command :

```
$ npm i
$ ./initial-setup.js
```

Now go to backend folder to deploy the lambda function code :

```
backend$ ./update-function-code.sh
```

Here we go, it's ready to test the UI locally. Go to frontend folder and run this :

```
frontend$ npm i
frontend$ npm run start
```
