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
    const {pickup_city,destination_city,notification_token,date,passenger_id,complete_date_time} = parsedBody
    const destination = `${pickup_city}_to_${destination_city}`;
    const dated = `${date}#${uuidv1()}`
    var unixTimestamp = Math.floor(new Date(complete_date_time+" GMT+05:00").getTime()/1000);
    var created_at = Math.floor(new Date().getTime()/1000);
    var expdate = unixTimestamp + 3600

    try{
    const params = {
        TableName: `${process.env.alertRideTable}`,
        Item:{
            destination:destination,
            date:dated,
            date_stamp: date,
            notification_token:notification_token,
            passenger_id:passenger_id,
            created_at: created_at,
            complete_date_time:complete_date_time,
            expdate:expdate
        }
}
            await doc.put(params).promise();
            const topicName = destination+`_${date}`
            const topicArn = await SNS.createTopicc(topicName)
            const platformEndpoint = await SNS.platformEndpoint(notification_token)
            await SNS.subscribe(topicArn,platformEndpoint)
            return Responses._200({
                message:"SUCCESS"
            });
        }catch(error){
        
        console.log('error', error);
        return Responses._400({ message: error.message});
        }

}