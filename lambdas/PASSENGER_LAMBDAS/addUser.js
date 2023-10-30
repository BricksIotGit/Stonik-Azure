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
    var currentDate = new Date();
    const currentDateStamp = currentDate.toLocaleString("PKT",{timeZone:"Asia/Karachi"});

    const base64File = parsedBody.image;
    const {id,name,gender,address,notification_token,cnic}= JSON.parse(event.body);   
    if(base64File === "null"){
        const dynamoParams = {
            TableName: tableName,
            Item:{
                PK:PK,
                user_id:id,
                id:id,
                name:name,
                gender:gender,
                address:address,
                notification_token:notification_token,
                image:base64File,
                cnic:cnic,
                status: "user",
                is_cnic_verified:false,
                is_license_verified:false,
                is_phone_verified:true
            }
        }
        const cashWalletCreateParams = {
            TableName: process.env.eWalletTableName,
            Item:{
                PK:"CashWallet",
                SK:id,
                created_at:currentDateStamp,
                payable: 0,
                total_earnings: 0
            }
        }
        const cashWallet = await doc.put(cashWalletCreateParams).promise()
        const data = await doc.put(dynamoParams).promise();
        const dataObject = JSON.stringify(data);
        await subscribeToTheAppWideNotification(notification_token)
        return Responses._200({
            id:id,
            name:name,
            gender:gender,
            address:address,
            notification_token:notification_token,
            image:base64File,
            cnic:cnic
        });

        }
        else{ 
        const fileName = `pofileImages/${new Date().toISOString()}.png`;
        const decodedFile = Buffer.from(base64File.replace(/^data:image\/\w+;base64,/, ""), "base64");
        const s3Params = {
            Bucket: process.env.imageUploadBucket,
            Key: fileName,
            Body: decodedFile,
            ContentType: "image/png",
            ACL: 'public-read'
        };
        await s3.upload(s3Params).promise();
        const url = `https://${process.env.imageUploadBucket}.s3.amazonaws.com/${fileName}`;
        const dynamoParams = {
            TableName: tableName,
            Item:{
                PK:PK,
                user_id:id,
                id:id,
                name:name,
                gender:gender,
                address:address,
                notification_token:notification_token,
                image:url,
                cnic:cnic,
                status: "user",
                is_cnic_verified:false,
                is_license_verified:false,
                is_phone_verified:true
            }
        }
        const cashWalletCreateParams = {
            TableName: process.env.eWalletTableName,
            Item:{
                PK:"CashWallet",
                SK:id,
                created_at:currentDateStamp,
                payable: 0,
                total_earnings: 0
            }
        }
        const cashWallet = await doc.put(cashWalletCreateParams).promise()
        const data = await doc.put(dynamoParams).promise();
        const dataObject = JSON.stringify(data);
        // Subscribe this user to app wide notificaion
        await subscribeToTheAppWideNotification(notification_token)
    
        return Responses._200({
            id:id,
            name:name,
            gender:gender,
            address:address,
            notification_token:notification_token,
            image:url,
            cnic:cnic
        });
        }

    } catch (error) {
        console.log('error', error);
        return Responses._400({ message: error.message || 'failed to upload image' });
    }
};

const subscribeToTheAppWideNotification = async (notificationToken) => {
    const topicArn = process.env.app_wide_topic_arn
    const platformEndpoint = await SNS.platformEndpoint(notificationToken)
    await SNS.subscribe(topicArn,platformEndpoint)
}