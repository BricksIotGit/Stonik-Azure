"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import * as SNS from "../SNS/sns"
const s3 = new AWS.S3(); 
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
exports.handler = async event => {
    try{
        const userPK = "User";
        const params = {
            TableName : process.env.userTableName,
            IndexName: "sortByStatus",
            ProjectionExpression:"image,#nam,cnic,notification_token,gender,address,driver_info,user_id",
            KeyConditionExpression: '#pk = :pk and #sk = :sk',
            ExpressionAttributeNames:{
              "#pk": "PK",
              "#sk": "status",
              "#nam":"name"
            },
            ExpressionAttributeValues: {
              ":pk": userPK,
              ":sk": "waiting_for_approval"
             
        
            }
        }

        const userData = await doc.query(params).promise()
        let users = []
        for(let i=0 ; i<userData.Items.length ; i++ ){

            var user = {
                name:userData.Items[i].name,
                cnic:userData.Items[i].cnic,
                phone_number:userData.Items[i].user_id,
                gender:userData.Items[i].gender,
                image_url:userData.Items[i].image,
                address:userData.Items[i].address,
                notification_token:userData.Items[i].notification_token,
                documents:userData.Items[i].driver_info
            }
            users.push(user)

        }

        return Responses._200({
            message:"SUCCESS",
            data:users
        })

    }catch(error){
        return Responses._400({
            message: error.message
        })
    }
    

}