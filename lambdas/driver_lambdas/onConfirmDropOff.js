"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import { PassThrough } from 'stream';
import * as SNS from "../SNS/sns"
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
exports.handler = async event =>{
    const parsedBody = JSON.parse(event.body);
    const pk = parsedBody.pk;
    const sk = parsedBody.sk;
    const passenger_sk = parsedBody.passenger_sk
    const user_id = parsedBody.passenger_id
    const status = "ACTIVE#"+process.env.dropped_off
    const notification_token = parsedBody.notification_token
try{
    const passengerParams = {
        TableName: `${process.env.driverPostedRidesTableName}`,
        Key:{
            "PK": pk,
            "SK":"passenger#"+sk
        },
        UpdateExpression: 'set ride_status= :active',
        ExpressionAttributeValues: {
          ":active":status
        }
      }
      const passengerConfirmedRideStatus = {
        TableName: `${process.env.confirmedRidesTableName}`,
        Key:{
            "PK": "Rides",
            "SK":user_id+"#"+passenger_sk
        },
        UpdateExpression: 'set ride_status= :active',
        ExpressionAttributeValues: {
          ":active":status
        }
      }
     
    const message = { 
        default: JSON.stringify("Default Message"),
        GCM: JSON.stringify({
            data: {
                action:status,
      }
    })
}
    await doc.update(passengerParams).promise()
    await doc.update(passengerConfirmedRideStatus).promise()
    var applicationArn = await SNS.platformEndpoint(notification_token)
    await SNS.publishToTheDevice(applicationArn,JSON.stringify(message))
    var messagee = Responses._data_msg_notification("Ride completed","Thanks for being ride with us",status,null)
      var applicationArnn = await SNS.platformEndpoint(notification_token)
      await SNS.publishToTheDevice(applicationArnn,JSON.stringify(messagee))
      return Responses._200({
          message:"SUCCESS"
      })

}catch(error){
    return Responses._400({
        message: error.message
    })
}


}
