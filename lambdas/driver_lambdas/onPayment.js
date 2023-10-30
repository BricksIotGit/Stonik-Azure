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
    const parsedBody = JSON.parse(event.body);
    const pk = parsedBody.pk;
    const sk = parsedBody.sk;
    const fare = parsedBody.fare;
    const seats = parsedBody.seats;
    const pickup = parsedBody.pickup;
    const dropoff = parsedBody.dropoff; 
    const status = "ACTIVE#"+process.env.on_payment
    const notification_token = parsedBody.notification_token
    const travledDistance = parsedBody.travelled_distance
    const pickupTime= parsedBody.pickup_time
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
     
    const message = { 
        default: JSON.stringify("Default Message"),
        GCM: JSON.stringify({
            data: {
                action:status,
                fare:fare,
                seats:seats,
                pickup,
                dropoff,
                pickup_time:pickupTime,
                travelled_distance:travledDistance
      }
    })
}
    var applicationArn = await SNS.platformEndpoint(notification_token)
    await SNS.publishToTheDevice(applicationArn,JSON.stringify(message))
    await doc.update(passengerParams).promise()
      return Responses._200({
          message:"SUCCESS"
      })

}catch(error){
    return Responses._400({
        message: error.message
    })
}


}
