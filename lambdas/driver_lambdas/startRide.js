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
    const {sk} = parsedBody
    let params = {
      TableName:`${process.env.confirmedRidesTableName}`,
      Key:{
          "PK": "Rides",
          "SK":sk
      },
      UpdateExpression: "set #ride_status = :started_status",
      ExpressionAttributeNames:{
          "#ride_status": "ride_status",
         
      },
      ExpressionAttributeValues:{
          ":started_status":"STARTED"
      },
      ReturnValues:"UPDATED_NEW"
  };

    await doc.update(params).promise()
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