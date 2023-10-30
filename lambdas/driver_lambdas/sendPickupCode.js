"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import * as SNS from "../SNS/sns"
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
exports.handler = async event =>{
  try{
    const parsedBody = JSON.parse(event.body);
    const {notification_token,code} = parsedBody
    const message = { 
        default: JSON.stringify("Default Message"),
        GCM: JSON.stringify({
            data: {
                action:"qr_code",
                code:code
      }
    })
}
    var applicationArn = await SNS.platformEndpoint(notification_token)
    await SNS.publishToTheDevice(applicationArn,JSON.stringify(message))

    
    return Responses._200({
      message:"SUCCESS"
    })

   
  }catch(err){
    console.log(err.message)
    return Responses._400({
        message: err.message
    })
  }
}