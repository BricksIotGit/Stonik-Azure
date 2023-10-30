/* 
          This file contains all(needed) SNS related function definations which can be utilise
          in any class where they are needed.
          
*/

import * as AWS from 'aws-sdk';
var sns = new AWS.SNS({apiVersion: '2010-03-31'});
const applicationArn = process.env.androidMoiblePlatformArn;
var currentDate = new Date();
const currentDateStamp = currentDate.toLocaleString("PKT",{timeZone:"Asia/Karachi"});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');

async function createTopicc(topicName){
    var topic = await sns.createTopic({Name: topicName}).promise()
    return topic.TopicArn
}

async function platformEndpoint(deviceToken){
    let platformEndpointParams = {    
        Token:deviceToken,
        PlatformApplicationArn: applicationArn,
        CustomUserData: uuidv1()
      };
      try{
      var endpoint = await sns.createPlatformEndpoint(platformEndpointParams).promise();
      return endpoint.EndpointArn  
    }catch(e){
      
        if(e.message.includes("already exists with the same Token, but different attributes.")){
          var endpointArn = e.message.toString().substring(42);
          endpointArn = endpointArn.substring(0,endpointArn.length-62);
          return endpointArn;
        }
      }
      
}

async function subscribe(topicArn,platformEndpoint){
    var subscribeParams = {
        Protocol: 'application', /* required */
        TopicArn: topicArn, /* required */
        Endpoint: platformEndpoint
      };

    var subscriptionPromise = sns.subscribe(subscribeParams).promise();
    return (await subscriptionPromise).SubscriptionArn
}

async function publish(topicArn,message){
  
    var publishParams = {
        Message: message,
         /* required */
        TopicArn: topicArn,
        MessageStructure: 'json'
        };
        var publishPromise = await sns.publish(publishParams).promise()
        return publishPromise.MessageId
}

async function publishToTheDevice(applicationArn,message){
  
  var publishParams = {
      Message: message,
       /* required */
      TargetArn: applicationArn,
      MessageStructure: 'json'
      };
      
      var publishPromise = await sns.publish(publishParams).promise()
     
}

async function deleteTopic(topicArn){
  var deleteTopicParams = {
      TopicArn: topicArn
      };
      
      var publishPromise = await sns.deleteTopic(deleteTopicParams).promise()
}


export {createTopicc,platformEndpoint,subscribe,publish,deleteTopic,publishToTheDevice}