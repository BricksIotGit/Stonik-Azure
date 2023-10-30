"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import { concatSeries } from 'async';
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
exports.handler = async event =>{
    const parsedBody = JSON.parse(event.body);
    try{
    const passengerID = event.pathParameters.passenger_id;
    const confirmedRidesParams = {
      TableName: `${process.env.confirmedRidesTableName}`,
      KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
      ExpressionAttributeNames:{
        "#pk": "PK",
        "#sk":"SK"
      },
      ExpressionAttributeValues: {
        ":sk":passengerID,
        ":pk":"Rides"
      }
    }

    let confirmedRides = await doc.query(confirmedRidesParams).promise()
    let data = []
    for(let i=0; i<confirmedRides.Items.length; i++){
      const rideStatus = confirmedRides.Items[i].ride_status;
      if(rideStatus === "ACTIVE#dropped_off"){
      let item = confirmedRides.Items[i]
      const userPK = "User";
      const userSK = item.driver_id
      const paramss = {
          TableName : process.env.userTableName,
          ProjectionExpression:"driver_info,image,#nam,is_cnic_verified,is_license_verified,is_phone_verified,notification_token",
          KeyConditionExpression: '#pk = :pk and #sk = :sk',
          ExpressionAttributeNames:{
            "#pk": "PK",
            "#sk": "user_id",
            "#nam":"name"
          },
          ExpressionAttributeValues: {
            ":pk": userPK,
            ":sk": userSK
           
      
          }
        }
      const userr = await doc.query(paramss).promise();
      const userInfo = userr.Items[0]
      const {name:driverName,image,is_cnic_verified,is_license_verified,is_phone_verified,driver_info} = userInfo
      const {vehicle_info} = driver_info
      const driverDetails = {
        driver_name:driverName,
        image:image,
        vehicle_info:vehicle_info,
        is_cnic_verified:is_cnic_verified,
        is_license_verified:is_license_verified,
        is_phone_verified:is_phone_verified
      }
      let ride  = {
        
        ride_id:item.ride_id,
        ride_status:item.ride_status,
        driver_details:driverDetails,
        subscribed_passenger_sk:item.subscribed_passenger_sk,
        driver_id: item.driver_id,
        driver_notification_token: item.driver_notification_token,
        estimated_distance: item.estimated_distance,
        estimated_time: item.estimated_time,
        fare_per_seat: item.fare_per_seat,
        post_id:item.post_id,
        seats_booked:item.seats_booked,
        is_driver_approved:item.is_driver_approved,
        post_date_time:item.post_date_time,
        passenger_location_latlngs:item.passenger_location_latlngs
        
      }
      
      data.push(ride)
    }
    }

      return Responses._200({
        message:"SUCCESS",
        data:data
      })

  }catch(error){
    Responses._400({
      message:error.message
    })
  }

    


}