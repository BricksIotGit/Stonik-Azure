"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});

exports.handler = async event =>{
    try{
    const driverID = event.pathParameters.driver_id 
    const paramss = {
        TableName : process.env.userTableName,
        ProjectionExpression:"driver_info",
        KeyConditionExpression: '#pk = :pk and #sk = :sk',
        ExpressionAttributeNames:{
          "#pk": "PK",
          "#sk": "user_id",
        },
        ExpressionAttributeValues: {
          ":pk": "User",
          ":sk": driverID
         
        }
      }
    const driverDetails = await doc.query(paramss).promise();
    return Responses._200({
        message:"SUCCESS",
        data:driverDetails.Items[0].driver_info
    })


    }catch(error){
        return Responses._400({
            message:error.message
        })
    }
}