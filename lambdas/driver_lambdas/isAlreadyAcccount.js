"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const s3 = new AWS.S3(); 
import * as SNS from "../SNS/sns"
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
exports.handler = async event => {
    try {
    const parsedBody = JSON.parse(event.body);
    const tableName = process.env.userTableName;
    const PK = "User"
    const {id,notification_token}= parsedBody
    const params = {
        TableName : tableName,
        KeyConditionExpression: '#pk = :pk and #sk = :sk',
        ExpressionAttributeNames:{
          "#pk": "PK",
          "#sk": "user_id"
        },
        ExpressionAttributeValues: {
          ":pk": PK,
          ":sk": id
    
        }
      }
      const userPomise = await doc.query(params).promise();
      const users = userPomise.Items
      if(users.length > 0){
            await updateUserNotificationToken(id,notification_token)
            await subscribeToTheAppWideNotification(notification_token)
            const {name,gender,address,image,cnic,status} = users[0]
            return Responses._200({
                isAlreadyAccount: true,
                name:name,
                gender:gender,
                address:address,
                image:image,
                cnic:cnic,
                status:status,
                message: "SUCCESS"
            })
      }else{
        return Responses._200({
            isAlreadyAccount: false,
            message: "SUCCESS"
        })
      }

    }catch(error){
        return Responses._400({
            message: error.message
        })
    }
}
const updateUserNotificationToken = async (id,notification_token) => {
    var params = {
        TableName:`${process.env.userTableName}`,
        Key:{
            "PK": "User" ,
            "user_id": id
        },
        UpdateExpression: "set #notification=:n ",
        ExpressionAttributeNames:{
            "#notification": "notification_token"
        },
        ExpressionAttributeValues:{
            ":n":notification_token
        },
        ReturnValues:"UPDATED_NEW"
    };
    await doc.update(params).promise();
    
}

const subscribeToTheAppWideNotification = async (notificationToken) => {
    const topicArn = process.env.app_wide_topic_arn
    const platformEndpoint = await SNS.platformEndpoint(notificationToken)
    await SNS.subscribe(topicArn,platformEndpoint)
}