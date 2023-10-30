"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
exports.handler = async event =>{
    const parsedBody = JSON.parse(event.body);
    const userId = event.pathParameters.user_id
try{
    const params = {
        TableName: `${process.env.driverPostedRidesTableName}`,
        IndexName: 'sortByUserID',
        ProjectionExpression:"ride_status,driver_id,post_id,date_time,no_of_seats_posted,location_info,pickup_latlng,alert_date,dropoff_latlng",
        KeyConditionExpression: '#pk = :pk and #user_id = :user_id',
        ExpressionAttributeNames:{
          "#user_id": "user_id",
          "#pk":"PK"
        },
        ExpressionAttributeValues: {
          ":user_id": userId,
          ":pk":"Rides"
        }
      }
    
    const promise = await doc.query(params).promise()
    const generalRides = promise.Items

    let postedRides = []
    for(let i=0 ;i<generalRides.length; i++){
      if(generalRides[i].ride_status.includes('ACTIVE')){
          postedRides.push(generalRides[i])
      }
    }
    const notificationsParams = {
      TableName: process.env.rideApprovalTableName,
      IndexName: 'sortByStatus',
      ProjectionExpression:"notification_id,payload,created_at",
      KeyConditionExpression: '#pk = :pk and #sk = :sk',
      ExpressionAttributeNames:{
        "#sk": "status",
        "#pk":"PK"
      },
      ExpressionAttributeValues: {
        ":sk": "ACTIVE",
        ":pk":userId
      }
    }
    const notificationsResult = await doc.query(notificationsParams).promise()
    console.log("Size: "+notificationsResult.Items.length)
    const notificationsList = []
    if(notificationsResult.Items.length > 0 ){
      console.log("Enter")
      for(let i=0 ; i<notificationsResult.Items.length; i++){
        const noti = notificationsResult.Items[i].notification_id
        console.log("notification: "+noti)
        const a = {
          notification_id: noti,
          created_at:notificationsResult.Items[i].created_at,
          payload: notificationsResult.Items[i].payload
      }
        notificationsList.push(a)
      }
    }
    
    let data = []
for(let i=0; i<postedRides.length; i++){

    const passengerParams = {
        TableName: `${process.env.driverPostedRidesTableName}`,
        IndexName: "sortStatus",
        KeyConditionExpression: '#pk = :pk and begins_with(ride_status, :active)',
        ExpressionAttributeNames:{
          "#pk":"PK"
        },
        ExpressionAttributeValues: {
          ":pk":postedRides[i].post_id,
          ":active":"ACTIVE"
        }
      }
      const subscribedPassengers = await doc.query(passengerParams).promise()
      let counter = 0
      for(let j = 0; j <notificationsList.length; j++){
            const post = notificationsList[j].payload.post_id;
            if(post === postedRides[i].post_id){
              counter++;
            }
      }
    let c = {
        driver_id:postedRides[i].driver_id,
        post_id: postedRides[i].post_id,
        date_time: postedRides[i].date_time,
        no_of_seats_posted: postedRides[i].no_of_seats_posted,
        location_info: postedRides[i].location_info,
        pickup_latlng: postedRides[i].pickup_latlng,
        dropoff_latlng: postedRides[i].dropoff_latlng,
        alert_date: postedRides[i].alert_date,
        subscribed_passengrs: subscribedPassengers.Items,
        notification_count: counter
    }
    data.push(c)
}



    return Responses._200({
        message:"SUCCESS",
        data:data
        
    })
    }catch(error){
        return Responses._400({
            message: error.message
        })
    }


}