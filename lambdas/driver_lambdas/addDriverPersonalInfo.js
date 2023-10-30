"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const s3 = new AWS.S3(); 
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
exports.handler = async event => {
    const parsedBody = JSON.parse(event.body);
    const {general_info,vehicle_info,driver_info}= JSON.parse(event.body);
    const{id,date_of_birth,cnic_images,cnic_no} = general_info;
    const{name,registration_no,color,seats,vehicle_images} = vehicle_info;
    const{license_issue_date,license_expiry_date,license_images} = driver_info; 
    

    try {
        const generalInfoURL = [];
        for(let i=0; i < cnic_images.length; i++){
            const fileName = `${id}/cnicImages/${new Date().toISOString()}.png`;
            const decodedFile = Buffer.from(cnic_images[i].replace(/^data:image\/\w+;base64,/, ""), "base64");
            const s3Params = {
                Bucket: process.env.imageUploadBucket,
                Key: fileName,
                Body: decodedFile,
                ContentType: "image/png",
                ACL: 'public-read'
            };
            generalInfoURL.push(`https://${process.env.imageUploadBucket}.s3.amazonaws.com/${fileName}`)
            await s3.upload(s3Params).promise();
  
        }
        const vehicleInfoURL = [];
        for(let i=0; i < vehicle_images.length; i++){
            const fileName = `${id}/vehicleImages/${new Date().toISOString()}.png`;
            const decodedFile = Buffer.from(vehicle_images[i].replace(/^data:image\/\w+;base64,/, ""), "base64");
            const s3Params = {
                Bucket: process.env.imageUploadBucket,
                Key: fileName,
                Body: decodedFile,
                ContentType: "image/png",
                ACL: 'public-read'
            };
            vehicleInfoURL.push(`https://${process.env.imageUploadBucket}.s3.amazonaws.com/${fileName}`)
            await s3.upload(s3Params).promise();
            
        }
        const licenseInfoURL = []
        for(let i=0; i < license_images.length; i++){
            const fileName = `${id}/licenseImages/${new Date().toISOString()}.png`;
            const decodedFile = Buffer.from(license_images[i].replace(/^data:image\/\w+;base64,/, ""), "base64");
            const s3Params = {
                Bucket: process.env.imageUploadBucket,
                Key: fileName,
                Body: decodedFile,
                ContentType: "image/png",
                ACL: 'public-read'
            };
            licenseInfoURL.push(`https://${process.env.imageUploadBucket}.s3.amazonaws.com/${fileName}`)
            await s3.upload(s3Params).promise();
            
        }

        const generalInfo = {
            id:id,
            cnic_no:cnic_no,
            date_of_birth:date_of_birth,
            cnic_images_urls: generalInfoURL
        }
        const vehicleInfo = {
                name:name,
                registration_no:registration_no,
                color:color,
                seats:seats,
                vehicle_images_urls: vehicleInfoURL
        }
        const licenseInfo = {
            license_issue_date:license_issue_date,
                license_expiry_date:license_expiry_date,
                license_images_urls: licenseInfoURL
        }

        const driverInfo = {
            vehicle_info:vehicleInfo,
            general_info:generalInfo,
            license_info:licenseInfo
        }
        var params = {
            TableName:`${process.env.userTableName}`,
            Key:{
                "PK": "User" ,
                "user_id": id
            },
            UpdateExpression: "set #di=:n , #stat=:st",
            ExpressionAttributeNames:{
                "#di": "driver_info",
                "#stat": "status"
               
            },
            ExpressionAttributeValues:{
                ":n":driverInfo,
                ":st":"waiting_for_approval"
            },
            ReturnValues:"UPDATED_NEW"
        };

        await doc.update(params).promise();
        return Responses._200({
            message:"SUCCESS",
    });

    } catch (error) {
        console.log('error', error);
        return Responses._400({ message: error.message});
    }
};