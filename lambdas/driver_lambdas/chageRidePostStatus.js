"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import { _200 } from '../HELPER_CLASSES/API_RESPONSES';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
exports.handler = async event =>{
    const parsedBody = JSON.parse(event.body);
    const postID = event.pathParameters.post_id

   
  try{
    let queryParams = {
        TableName:`${process.env.driverPostedRidesTableName}`,
        IndexName: "sortByPostID",
        ProjectionExpression:"SK",
        KeyConditionExpression: '#pk = :pk and #sk = :sk',
        ExpressionAttributeNames:{
          "#sk": "post_id",
          "#pk":"PK"
        },
        ExpressionAttributeValues: {
          ":sk": postID,
          ":pk":"Rides"
        }
        
        }

        const sortKeyPomise = await doc.query(queryParams).promise()
        const sortKey = sortKeyPomise.Items[0].SK

    let postRideStatusParams = {
        TableName:`${process.env.driverPostedRidesTableName}`,
        Key:{
            "PK": "Rides",
            "SK": sortKey
        },
        UpdateExpression: "set #ride_status = :ride_status",
        ExpressionAttributeNames:{
            "#ride_status": "ride_status",
           
        },
        ExpressionAttributeValues:{
            ":ride_status":"COMPLETED"
        },
        ReturnValues:"UPDATED_NEW"
    };
    await doc.update(postRideStatusParams).promise()
    return Responses._200({
        message: "SUCCESS"
    })

}catch(error){
    return Responses._400({
        message: error.message
    })
}


}