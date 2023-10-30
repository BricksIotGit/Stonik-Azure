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
    const status = "ACTIVE#"+process.env.going_to_pickup;
    const {pk,sk,notification_token,user_id,seats_booked,estimated_fare,driver_number,start_city,drop_city,passenger_sk} = parsedBody
    const paramss = {
      TableName : process.env.userTableName,
      ProjectionExpression:"driver_info,#nam,#img,notification_token",
      KeyConditionExpression: '#pk = :pk and #sk = :sk',
      ExpressionAttributeNames:{
        "#pk": "PK",
        "#nam":"name",
        "#img":"image",
        "#sk": "user_id",
      },
      ExpressionAttributeValues: {
        ":pk": "User",
        ":sk": driver_number
       
      }
    }
  const driverDetails = await doc.query(paramss).promise();
  const vehicleInfo = driverDetails.Items[0].driver_info.vehicle_info
  const driverName = driverDetails.Items[0].name
  const driverImage = driverDetails.Items[0].image
  const notification_tokenn = driverDetails.Items[0].notification_token
  const payload = {
    vehicle_info: vehicleInfo,
    driver_name: driverName,
    driver_image:driverImage,
    driver_phone_number:driver_number,
    driver_notification_token: notification_tokenn,
    start_city,
    drop_city,
    estimated_fare,
    seats_booked
  }
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
  const driverStatus = {
    TableName: `${process.env.driverPostedRidesTableName}`,
    Key:{
        "PK": "Rides",
        "SK":start_city+"#"+pk
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
     await doc.update(passengerParams).promise()
     await doc.update(driverStatus).promise()
     await doc.update(passengerConfirmedRideStatus).promise()
    var message = Responses._data_msg_notification("Picking up!","Driver is coming towards you for pickup, please get ready.",status,payload)
    var applicationArn = await SNS.platformEndpoint(notification_token)
    await SNS.publishToTheDevice(applicationArn,JSON.stringify(message))
    const notificationParams = {
        TableName: process.env.notificationTable,
        Item:{
            PK: user_id,
            created_at: currentDateStamp,
            title: "Picking up!",
            message: "Driver is coming towards you for pickup, please get ready.",
            click_action: status
        }
    }
    
    await doc.put(notificationParams).promise();
    
    return Responses._200({
      message:"SUCCESS",
    })

   
  }catch(err){
    console.log(err.message)
    return Responses._400({
        message: err.message
    })
  }
}