"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import * as SNS from '../SNS/sns'
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});

exports.handler = async event =>{

    try{
    const parsedBody = JSON.parse(event.body);

    let {driver_id,passenger_id,passenger_ride_id,seats_booked,post_id,start_city} = parsedBody
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
        ProjectionExpression: "occupied_seats,no_of_seats_posted",
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
    const seatsPosted = driverPost.Items[0].no_of_seats_posted
    console.log("noOFPostedSeats: "+noOfOccupiedSeats)
    const newSeats = noOfOccupiedSeats - seats_booked
    const leftSeats = seatsPosted - newSeats
    console.log("newSeats : "+newSeats)
    let updateDriverPostParams = null
        updateDriverPostParams = {
            TableName: `${process.env.driverPostedRidesTableName}`,
            Key:{
                "PK": "Rides",
                "SK":`${start_city}#${post_id}`
            },
            UpdateExpression: "set occupied_seats = :seats,  ride_status = :rideStatus , seats_left= :leftseats",
    
            ExpressionAttributeValues:{
                ":seats":newSeats,
                ":leftseats":leftSeats,
                ":rideStatus":"ACTIVE"
            },
            ReturnValues:"UPDATED_NEW"
        };
    
        const notificationsParams = {
            TableName: process.env.rideApprovalTableName,
            IndexName: 'sortByStatus',
            ProjectionExpression:"notification_id,payload",
            KeyConditionExpression: '#pk = :pk and #sk = :sk',
            ExpressionAttributeNames:{
              "#sk": "status",
              "#pk":"PK"
            },
            ExpressionAttributeValues: {
              ":sk": "ACTIVE",
              ":pk":driver_id
            }
          }
        const notificationIDS = await doc.query(notificationsParams).promise()
        for(let i=0; i<notificationIDS.Items.length; i++){
            const {post_id:rideApprovalPostID} = notificationIDS.Items[i].payload
            if(rideApprovalPostID === post_id){
                const notificationID = notificationIDS.Items[i].notification_id
                const updateNotificationStatus = {
                    TableName: process.env.rideApprovalTableName,
                    Key:{
                        "PK": driver_id,
                        "SK":notificationID
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

    await doc.update(updateDriverPostParams).promise()
    await doc.update(passengerRidesParamas).promise()

    return Responses._200({
        message:"SUCCESS"
    })

    }catch(error){
        return Responses._400({
            message: error.message
        })
    }

}