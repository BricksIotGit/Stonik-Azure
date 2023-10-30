"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
var currentDate = new Date();
const currentDateStamp = currentDate.toLocaleString("PKT",{timeZone:"Asia/Karachi"});
exports.handler = async event =>{

    try{
    const parsedBody = JSON.parse(event.body);

    let {passenger_id,passenger_ride_id,driver_name} = parsedBody
    console.log("Body: "+parsedBody)
    let passengerRidesParamas = {
        TableName:`${process.env.confirmedRidesTableName}`,
        Key:{
            "PK": "Rides",
            "SK":`${passenger_id}#${passenger_ride_id}`
        },
        UpdateExpression: "set #ride_status = :rejected_status",
        ExpressionAttributeNames:{
            "#ride_status": "ride_status",
           
        },
        ExpressionAttributeValues:{
            ":rejected_status":"REJECTED"
        },
        ReturnValues:"UPDATED_NEW"
    };
    const notificationParams = {
        TableName: process.env.notificationTable,
        Item:{
            PK: passenger_id,
            created_at: currentDateStamp,
            title: "Ride Rejected",
            message: `${driver_name} has rejected your ride request. Tap to see the details`,
            click_action: "rideRejected"
        }
    }

    await doc.update(passengerRidesParamas).promise()
    await doc.put(notificationParams).promise()

    return Responses._200({
        message:"SUCCESS"
    })

    }catch(error){
        return Responses._400({
            message: error.message
        })
    }

}