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
    const post_id = event.pathParameters.post_id
try{
    const passengerParams = {
        TableName: `${process.env.driverPostedRidesTableName}`,
        KeyConditionExpression: '#pk = :pk and begins_with(SK, :sk) ',
        ExpressionAttributeNames:{
          "#pk":"PK"
        },
        ExpressionAttributeValues: {
          ":pk":post_id,
          ":sk":"passenger"
        }
      }
      const subscribedPassengers = await doc.query(passengerParams).promise()
      return Responses._200({
          message:"SUCCESS",
          data: subscribedPassengers.Items
      })

}catch(error){
    return Responses._400({
        message: error.message
    })
}


}
