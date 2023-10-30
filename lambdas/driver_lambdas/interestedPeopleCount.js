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
            ProjectionExpression: "passenger_id",
            KeyConditionExpression: "#route = :route",
            ExpressionAttributeNames:{"#route": "destination"},
            ExpressionAttributeValues: {":route": route}
        };
       var people = await doc.query(params).promise();
       const ids = []
       people.Items.forEach(element => {
           ids.push(element.passenger_id)
       });
       return Responses._200({
           message: "SUCCESS",
           passenger_ids:ids
       })
        }
        catch(error){
        console.log('error', error);
        return Responses._400({ message: error.message});
        }

}