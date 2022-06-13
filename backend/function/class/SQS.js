"use strict";
let AWS = require('aws-sdk');
let sqs = new AWS.SQS();

class SQS {
  /** Constructor parameter item object
  @item record item
  */
  constructor(item) {
    this.postfix = 'globalchat';
    this.id = item.eventSourceARN.split(":")[4];
    this.projectName = item.eventSourceARN.split("/")[1].replace("_dynDB","");
  }

  /** send a message to the SQS queue. If the queue doesn't exist, then create it.
  This function is always the last call in lambda and for that reason it executes 'callback'
  @param msgBody The message to send. If it is empty, a default is set.
  */
  async sendMessage(msgBody) {
    try {
      console.log('sendMessage entered')

      let message = {
        MessageBody: msgBody, // message for sqs
        QueueUrl: "https://sqs."+ AWS.config.region +".amazonaws.com/" + this.id + "/" + this.projectName + "_" + this.postfix
      }
      await sqs.sendMessage(message).promise();
      console.log("SQS message sent")
    } catch (err) { // catch non-existant queue error and send failures
      console.log("SQS message fails : " + err.code + ", The item : " + this.postfix);
    }
  }
}

module.exports = {
  SQS
}
