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
    const {user_id,notification_id,status} = parsedBody
    const updateNotificationStatus = {
        TableName: process.env.rideApprovalTableName,
        Key:{
            "PK": user_id,
            "SK":notification_id
        },
        UpdateExpression: "set #statuss = :statuss",
        ExpressionAttributeValues:{
            ":statuss":status
        },
        ExpressionAttributeNames:{
            "#statuss": "status",
           
        },
        ReturnValues:"UPDATED_NEW"
    };

    await doc.update(updateNotificationStatus).promise()
    
    return Responses._200({
        message:"SUCCESS"
    })
}catch(error){
    return Responses._400({
        message:error.message
    })
}
    
}