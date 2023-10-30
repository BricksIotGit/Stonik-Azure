"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});

exports.handler = async event =>{
    try{
        const route = event.pathParameters.route
        var params = {
            TableName : `${process.env.alertRideTable}`,
            ProjectionExpression: "passenger_id,#datee",
            KeyConditionExpression: "#route = :route",
            ExpressionAttributeNames:{"#route": "destination","#datee":"complete_date_time"},
            ExpressionAttributeValues: {":route": route}
        };
       var people = await doc.query(params).promise();
       const interestedPeople = []
       for(let i=0; i< people.Items.length; i++){
           console.log("userID:"+people.Items[i].passenger_id)
        var paramss = {
            TableName : `Users`,
            ProjectionExpression: "image",
            KeyConditionExpression: "#pk = :pk and #user_id = :user_id",
            ExpressionAttributeNames:{"#pk": "PK","#user_id":"user_id"},
            ExpressionAttributeValues: 
            {":pk": "User",
            ":user_id":`${people.Items[i].passenger_id}`}
        };
        var images = await doc.query(paramss).promise()

        console.log("images: "+JSON.stringify(images))
        console.log("url: "+images.Items[0].image)
        console.log("date: "+people.Items[i].complete_date_time)
        var passengerImage = images.Items[0].image
        interestedPeople.push({
            image_url: passengerImage,
            date:people.Items[i].complete_date_time
        })
       }
       
       

       return Responses._200({
           message: "SUCCESS",
           interested_people:interestedPeople
       })
        }
        catch(error){
        console.log('error', error);
        return Responses._400({ message: error.message});
        }

}