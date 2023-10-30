"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import * as SNS from "../SNS/sns"
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'})
var currentDate = new Date();
const currentDateStamp = currentDate.toLocaleString("PKT",{timeZone:"Asia/Karachi"});
exports.handler = async event => {
    try{
    const parsedBody = JSON.parse(event.body);
    let {status,remarks,device_token,user_id} = parsedBody
    let stType = "not_approved"
    if(status === "true"){
        stType = "approved"
       remarks = "Congratulations! Your documents have been successfully approved, now you can post your ride."
    }
    var params = {
        TableName:`${process.env.userTableName}`,
        Key:{
            "PK": "User" ,
            "user_id": user_id
        },
        UpdateExpression: "set #stat=:st, remarks = :rmk, #ras = :rs, is_cnic_verified = :rs, is_license_verified = :rs",
        ExpressionAttributeNames:{
            "#stat": "status",
            "#ras":"ride_approval_status"
        },
        ExpressionAttributeValues:{
            ":st":stType,
            ":rmk":remarks,
            ":rs":status
        },
        ReturnValues:"UPDATED_NEW"
    };
   // var message = Responses._verifyDriverInfoNotification("Documents Approval",remarks,status,"VerifiedDriverInfo")
    var message = Responses._messageFormat("Documents Approval",remarks,"VerifiedDriverInfo",status)

    var applicationArn = await SNS.platformEndpoint(device_token)
    await doc.update(params).promise();
    await SNS.publishToTheDevice(applicationArn,JSON.stringify(message))
    const notificationParams = {
        TableName: process.env.notificationTable,
        Item:{
            PK: user_id,
            created_at: currentDateStamp,
            title: "Documents Approval",
            message: remarks,
            click_action: "VerifiedDriverInfo"
        }
    }
    var res = await doc.put(notificationParams).promise();
    console.log("Response: "+currentDate);
    return Responses._200({
        message:"Succeeded"
    })
    }catch(error){
        return Responses._400({
            message: error.message
        })
    }
    

}