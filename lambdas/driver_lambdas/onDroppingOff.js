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
    const pk = parsedBody.pk;
    const sk = parsedBody.sk;
    const status = "ACTIVE#"+process.env.going_to_drop_off
    const notification_token = parsedBody.notification_token
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
     await doc.update(passengerParams).promise()
      var message = Responses._data_msg_notification("Dropping off","Driver is selected you to drop, please get ready.",status,null)
      var applicationArn = await SNS.platformEndpoint(notification_token)
      await SNS.publishToTheDevice(applicationArn,JSON.stringify(message))

      return Responses._200({
          message:"SUCCESS"
      })

}catch(error){
    return Responses._400({
        message: error.message
    })
}


}
