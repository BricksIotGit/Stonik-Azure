"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import * as SNS from '../SNS/sns'
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
var currentDate = new Date();
const currentDateStamp = currentDate.toLocaleString("PKT",{timeZone:"Asia/Karachi"});
exports.handler = async event =>{

    try{
    const parsedBody = JSON.parse(event.body);

    let {passenger_id,passenger_ride_id,post_id,subscribed_passenger_sk,seats_booked,passenger_name,driver_id,start_city} = parsedBody
    let passengerRidesParamas = {
        TableName:`${process.env.confirmedRidesTableName}`,
        Key:{
            "PK": "Rides",
            "SK":`${passenger_id}#${passenger_ride_id}`
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
    const driverPostParams = {
        TableName: `${process.env.driverPostedRidesTableName}`,
        IndexName: "sortByPostID",
        ProjectionExpression: "occupied_seats,no_of_seats_posted,ride_status",
        KeyConditionExpression: '#pk = :pk and post_id = :driver_post_id',
        ExpressionAttributeNames:{
          "#pk": "PK"
        },
        ExpressionAttributeValues: {
          ":driver_post_id":post_id,
          ":pk":"Rides"
        }
    }

    const driverPost = await doc.query(driverPostParams).promise()
    const noOfOccupiedSeats = driverPost.Items[0].occupied_seats
    const postedSeats = driverPost.Items[0].no_of_seats_posted
    const rideStatus = driverPost.Items[0].ride_status
    if(rideStatus === "ACTIVE" || rideStatus === "ACTIVE#OCCUPIED" || rideStatus === "ACTIVE#"+process.env.going_to_pickup){
    console.log("noOFPostedSeats: "+noOfOccupiedSeats)
    const newSeats = noOfOccupiedSeats - seats_booked
    const leftSeats = postedSeats - newSeats
    console.log("newSeats : "+newSeats)
    let updateDriverPostParams = null
        updateDriverPostParams = {
            TableName: `${process.env.driverPostedRidesTableName}`,
            Key:{
                "PK": "Rides",
                "SK":`${start_city}#${post_id}`
            },
            UpdateExpression: "set occupied_seats = :seats,  ride_status = :rideStatus, seats_left= :leftseats",
    
            ExpressionAttributeValues:{
                ":seats":newSeats,
                ":leftseats":leftSeats,
                ":rideStatus":"ACTIVE"
            },
            ReturnValues:"UPDATED_NEW"
        };
        let driverSubscribedPassengerParams = {
            TableName: `${process.env.driverPostedRidesTableName}`,
            Key:{
                "PK": post_id,
                "SK":"passenger#"+subscribed_passenger_sk
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
        await doc.update(driverSubscribedPassengerParams).promise()
        await doc.update(updateDriverPostParams).promise()
    }
    

    await doc.update(passengerRidesParamas).promise()

    const notificationParams = {
        TableName: process.env.notificationTable,
        Item:{
            PK: driver_id,
            created_at: currentDateStamp,
            title: "Ride Cancelled",
            message: `${passenger_name} has cancelled your ride request. Tap to see the details`,
            click_action: "rideCancelled"
        }
    }
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