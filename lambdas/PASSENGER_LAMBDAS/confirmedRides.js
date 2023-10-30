"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import * as SNS from '../SNS/sns'
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
exports.handler = async event =>{
    const parsedBody = JSON.parse(event.body);
    const {post_id,driver_id,passenger_id,fare_per_seat,estimated_time,estimated_distance,seats_booked,notification_token,driver_notification_token,passenger_location_latlngs,post_date_time,pickup_city} = parsedBody
    const dateObject = new Date().toISOString();
    var currentDate = new Date();
    const currentDateStamp = currentDate.toLocaleString("PKT",{timeZone:"Asia/Karachi"});
    var unixTimestamp = Math.floor(new Date(post_date_time+" GMT+05:00").getTime()/1000);
    var expdate = unixTimestamp + 5260000 

    try{
            var rideId = uuidv1();      
            const params = {
                TableName: `${process.env.confirmedRidesTableName}`,
                Item:{
                    PK:"Rides",
                    SK:`${passenger_id}#${rideId}`,
                    ride_id:rideId,
                    driver_id:driver_id,
                    post_id:post_id,
                    passenger_id:passenger_id,
                    created_at: dateObject,
                    fare_per_seat:fare_per_seat,
                    estimated_time:estimated_time,
                    estimated_distance:estimated_distance,
                    seats_booked:seats_booked,
                    driver_notification_token:driver_notification_token,
                    passenger_location_latlngs:passenger_location_latlngs,
                    post_date_time:post_date_time,
                    is_driver_approved:false,
                    ride_status:"ACTIVE",
                    route_index:"default",
                    expdate:expdate
        
                }
        }
        console.log("PostID: "+post_id)
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
        const rideStatus = driverPost.Items[0].ride_status
        console.log("rideStatus:  "+rideStatus)
        
        if(rideStatus === "ACTIVE#"+process.env.going_to_pickup ){
                return Responses._400({ message: "Sorry, this ride is already started"});
            }
        if(rideStatus === "CANCELLED" || rideStatus === "ACTIVE#OCCUPIED" || rideStatus === "COMPLETED") {
            return Responses._400({ message: "Sorry, this ride doesn't exist"});
        }  
        const noOfOccupiedSeats = driverPost.Items[0].occupied_seats
        const postedSeats = driverPost.Items[0].no_of_seats_posted
        console.log("noOFPostedSeats: "+noOfOccupiedSeats)
        const newSeats = noOfOccupiedSeats + seats_booked
        const seatsLeft = postedSeats - newSeats
        console.log("newSeats : "+newSeats)
        let updateDriverPostParams = null
        if(newSeats === postedSeats){
            updateDriverPostParams = {
                TableName: `${process.env.driverPostedRidesTableName}`,
                Key:{
                    "PK": "Rides",
                    "SK":`${pickup_city}#${post_id}`
                },
                UpdateExpression: "set occupied_seats = :seats, ride_status = :rideStatus , seats_left= :leftseats",
        
                ExpressionAttributeValues:{
                    ":seats":newSeats,
                    ":leftseats":seatsLeft,
                    ":rideStatus": "ACTIVE#OCCUPIED"
                },
                ReturnValues:"UPDATED_NEW"
            };
        }
        else{
            updateDriverPostParams = {
                TableName: `${process.env.driverPostedRidesTableName}`,
                Key:{
                    "PK": "Rides",
                    "SK":`${pickup_city}#${post_id}`
                },
                UpdateExpression: "set occupied_seats = :seats , seats_left= :leftseats",
        
                ExpressionAttributeValues:{
                    ":seats":newSeats,
                    ":leftseats":seatsLeft
                },
                ReturnValues:"UPDATED_NEW"
            };
        }

        
        var notificationID = uuidv1();
        const userPK = "User";
        const passengerInfoParams = {
            TableName : process.env.userTableName,
            ProjectionExpression:"image,#nam,notification_token,gender",
            KeyConditionExpression: '#pk = :pk and #sk = :sk',
            ExpressionAttributeNames:{
              "#pk": "PK",
              "#sk": "user_id",
              "#nam":"name"
            },
            ExpressionAttributeValues: {
              ":pk": userPK,
              ":sk": passenger_id
             
        
            }
        }

        const passengerInf = await doc.query(passengerInfoParams).promise()
        const passengerDetails = passengerInf.Items[0]
        const {name,gender,notification_token,image} = passengerDetails

        var passengerinfo = {
            name:name,
            gender:gender,
            notification_token:notification_token,
            image_url:image,
            phone_number:passenger_id

        }
        var notificationPayload = {
            ride_id: rideId,
            post_id:post_id,
            fare_per_seat:fare_per_seat,
            estimated_time:estimated_time,
            estimated_distance:estimated_distance,
            seats_booked:seats_booked,
            passenger_location_latlngs:passenger_location_latlngs,
            passenger_info : passengerinfo,
            click_action:"clickAction"

        }
        const rideApprovalNotification = {
            TableName: process.env.rideApprovalTableName,
            Item:{
                PK: driver_id,
                SK: notificationID,
                notification_id: notificationID,
                status: "ACTIVE",
                created_at:currentDateStamp,
                payload: notificationPayload
            }
        }
        
        const notificationParams = {
            TableName: process.env.notificationTable,
            Item:{
                PK: driver_id,
                created_at: currentDateStamp,
                title: "Ride Request",
                message: `${name} has requested to your ride, tap to see the details`,
                click_action: "rideRequest"
            }
        }
    
        await doc.put(rideApprovalNotification).promise()
        await doc.update(updateDriverPostParams).promise()
        await doc.put(params).promise();
        await doc.put(notificationParams).promise()
    
            return Responses._200({
                message:"SUCCESS"
            });
        }catch(error){
        console.log('error', error);
        return Responses._400({ message: error.message});
        }

}