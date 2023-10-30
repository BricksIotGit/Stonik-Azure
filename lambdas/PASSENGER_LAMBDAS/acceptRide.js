"use strict";
  const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
  import * as AWS from 'aws-sdk';
  import * as SNS from "../SNS/sns"
  const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
  const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
  var currentDate = new Date();
  const currentDateStamp = currentDate.toLocaleString("PKT",{timeZone:"Asia/Karachi"});
  const { 
      v1: uuidv1,
      v4: uuidv4,
    } = require('uuid');
  
    exports.handler = async event =>{
   
    try{
    const parsedBody = JSON.parse(event.body);
    const {driver_name,ride_id,post_id,fare_per_seat,estimated_time,estimated_distance,seats_booked,passenger_location_latlngs,passenger_info} = parsedBody
    const {notification_token,phone_number} = passenger_info
    var rideId = uuidv1(); 
    var addPassenger = {
        TableName:process.env.driverPostedRidesTableName,
        Item:{
            PK: post_id,
            SK: "passenger#"+rideId,
            ride_id:rideId,
            ride_status:"ACTIVE",
            passenger_info:passenger_info,
            fare_per_seat:fare_per_seat,
            estimated_time:estimated_time,
            estimated_distance:estimated_distance,
            seats_booked:seats_booked,
            passenger_ride_sk:ride_id,
            passenger_location_latlngs:passenger_location_latlngs
            
        }
    };

    var updateConfiremdRideStatus = {
        TableName: `${process.env.confirmedRidesTableName}`,
        Key:{
            "PK": "Rides",
            "SK": `${phone_number}#${ride_id}`
        },
        UpdateExpression: "set is_driver_approved=:n, subscribed_passenger_sk=:rideID",
        ExpressionAttributeValues:{
            ":n":true,
            ":rideID":rideId
        },
        ReturnValues:"UPDATED_NEW"
    };
    var updateConfiremdRideStatus = {
        TableName: `${process.env.confirmedRidesTableName}`,
        Key:{
            "PK": "Rides",
            "SK": `${phone_number}#${ride_id}`
        },
        UpdateExpression: "set is_driver_approved=:n, subscribed_passenger_sk=:rideID",
        ExpressionAttributeValues:{
            ":n":true,
            ":rideID":rideId
        },
        ReturnValues:"UPDATED_NEW"
    };
    const notificationParams = {
        TableName: process.env.notificationTable,
        Item:{
            PK: phone_number,
            created_at: currentDateStamp,
            title: "Ride Confirmed",
            message: `${driver_name} has accepted your ride request. Tap to see the details`,
            click_action: "rideAccepted"
        }
    }


    await doc.update(updateConfiremdRideStatus).promise()
    await doc.put(addPassenger).promise()
    await doc.put(notificationParams).promise()

    
    // const topicArn = await SNS.createTopicc(post_id);
    // const platformEndpointArn = await SNS.platformEndpoint(notification_token);
    // await SNS.subscribe(topicArn,platformEndpointArn)

    return Responses._200({
        message:"SUCCESS"
    })

}catch(error){
    Responses._400({
        message: error.message
    })
}
}