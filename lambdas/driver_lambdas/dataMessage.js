"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
exports.handler = async event =>{
  try{
    const parsedBody = JSON.parse(event.body);
    const {notification_token,user_id} = parsedBody
    var message = Responses._data_msg_notification("Picking up!","Driver is coming towards you for pickup, please get ready.","picking_up")
    var applicationArn = await SNS.platformEndpoint(notification_token)
    await SNS.publishToTheDevice(applicationArn,JSON.stringify(message))
    const notificationParams = {
        TableName: process.env.notificationTable,
        Item:{
            PK: user_id,
            created_at: currentDateStamp,
            title: "Picking up!",
            message: "Driver is coming towards you for pickup, please get ready.",
            click_action: "picking_up"
        }
    }
    
    await doc.put(notificationParams).promise();
    
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