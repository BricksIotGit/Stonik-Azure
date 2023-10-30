"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import * as SNS  from "../SNS/sns"
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});

const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
exports.handler = async event =>{
 
    try{
        const body = JSON.parse(event.body);
        const {pickup_city, post_id,driver_name,passengers,user_id} = body
        console.log("Body; "+body)
        const randomID = uuidv1();
        const tableName = process.env.driverPostedRidesTableName;
        const topicArn = `${process.env.topicArn}:${post_id}`
        const message  = Responses._notficationFormat("Ride Cancelled", `${driver_name} has just cancelled a ride`,"PassengerHome");   
        const params = {
            TableName:tableName,
            Key:{
                "PK": "Rides",
                "SK":`${pickup_city}#${post_id}`
            },
            UpdateExpression: "set #ride_status = :cancelled_status",
            ExpressionAttributeNames:{
                "#ride_status": "ride_status",
               
            },
            ExpressionAttributeValues:{
                ":cancelled_status":"CANCELLED"
            },
            ReturnValues:"UPDATED_NEW"
        };
        // Change Ride Status of each subscribed passenger to CANCELLED
       if(passengers.length > 0){
        for(let i=0; i<passengers.length; i++){
            let {passenger_id,passenger_ride_sk} = passengers[i]
            console.log("passengerID: "+passenger_id+"\nPasssengerRideSK: "+passenger_ride_sk)
            let passengerRidesParamas = {
                TableName:`${process.env.confirmedRidesTableName}`,
                Key:{
                    "PK": "Rides",
                    "SK":`${passenger_id}#${passenger_ride_sk}`
                },
                UpdateExpression: "set #ride_status = :cancelled_status",
                ExpressionAttributeNames:{
                    "#ride_status": "ride_status",
                   
                },
                ExpressionAttributeValues:{
                    ":cancelled_status":"CANCELLED"
                },
                ReturnValues:"UPDATED_NEW"
            };

            await doc.update(passengerRidesParamas).promise()
        }

        const notificationsParams = {
            TableName: process.env.rideApprovalTableName,
            IndexName: 'sortByStatus',
            ProjectionExpression:"notification_id",
            KeyConditionExpression: '#pk = :pk and #sk = :sk',
            ExpressionAttributeNames:{
              "#sk": "status",
              "#pk":"PK"
            },
            ExpressionAttributeValues: {
              ":sk": "ACTIVE",
              ":pk":user_id
            }
          }
        const notificationIDS = await doc.query(notificationsParams).promise()
        for(let i= 0 ;i<notificationIDS.Items.length; i++){
            const updateNotificationStatus = {
                TableName: process.env.rideApprovalTableName,
                Key:{
                    "PK": user_id,
                    "SK":notificationIDS.Items[i].notification_id
                },
                UpdateExpression: "set #statuss = :statuss",
                ExpressionAttributeValues:{
                    ":statuss":"CANCELLED_BY_DRIVER"
                },
                ExpressionAttributeNames:{
                    "#statuss": "status",
                   
                },
                ReturnValues:"UPDATED_NEW"
            };
        
            await doc.update(updateNotificationStatus).promise()
        }

        

       }
        await doc.update(params).promise()

        // // Sending notification to each subscribed passenger to know that driver has cancelled this ride
        // if(passengers.length > 0){
        // console.log(topicArn)
        // await SNS.publish(topicArn,JSON.stringify(message));
        // await SNS.deleteTopic(topicArn);
        // }

        return Responses._200({
            message: "SUCCESS"
        })

    }catch(error){
            console.log(error.message)
            return Responses._400({
                message: error.message
            })
    }

    }
