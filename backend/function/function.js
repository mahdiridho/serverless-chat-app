"use strict";

const SQS = require('./class/SQS').SQS;

exports.handler = async (event) => {
  console.log("Records length: ", event.Records.length)
  // send SQS message for any dynamocb events to tell the clients need repopulating the chat history
  if (event.Records.length) {
    let sqs = new SQS(event.Records[0]);
    try {
      await sqs.sendMessage('History updated');
    } catch (e) {
      console.log(e)
    }
  }
  return "Done";
}
