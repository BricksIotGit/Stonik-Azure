"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});

exports.handler = async event =>{
    try{
    const parsedBody = JSON.parse(event.body);
    const userId = event.pathParameters.user_id
    const postId = event.pathParameters.post_id

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
        passenger_name: notificationsResult.Items[i].payload.passenger_info.name,
        created_at:notificationsResult.Items[i].created_at,
        payload: notificationsResult.Items[i].payload
    }
      notificationsList.push(a)
    }
  }
  let notifications = []
      for(let j = 0; j <notificationsList.length; j++){
            const post = notificationsList[j].payload.post_id;
            if(post === postId){
              notifications.push(notificationsList[j])
            }
      }

    return Responses._200({
        message:"SUCCESS",
        notification_data:notifications
    })

    }
  catch(error){
    return Responses._200({
        message:error.message
    })
  }

}