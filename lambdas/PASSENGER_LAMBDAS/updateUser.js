"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const s3 = new AWS.S3(); 
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
exports.handler = async event => {
    const parsedBody = JSON.parse(event.body);
    console.log(parsedBody)
    const {id} = event.pathParameters;
    const {name,gender,address} = JSON.parse(event.body);
    const tableName = process.env.userTableName;
    const pk= "User";
    const sk= id;
    try{
    var params = {
        TableName:tableName,
        Key:{
            "PK": pk,
            "user_id":sk
        },
        UpdateExpression: "set #nam=:n, gender=:g, address=:a",
        ExpressionAttributeNames:{
            "#nam": "name",
           
        },
        ExpressionAttributeValues:{
            ":n":name,
            ":g":gender,
            ":a":address
        },
        ReturnValues:"UPDATED_NEW"
    };
  
    const parsedData = await doc.update(params).promise();
            return Responses._200({
                name:parsedData.Attributes.name,
                gender:parsedData.Attributes.gender,
                address:parsedData.Attributes.address
            })
    }catch(error){
        
        return Responses._400({
            message:"failed in data updating: "+error.message
        })
    }

}