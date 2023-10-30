
const Responses = require("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});

exports.handler = async event => {
try{
    const phoneNumber= event.pathParameters.phone_number;
const userPK = "User";
const paramss = {
    TableName : process.env.userTableName,
    ProjectionExpression:"driver_info,#st,image,#nam,gender,user_id,cnic,is_cnic_verified,is_license_verified,is_phone_verified,notification_token",
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames:{
      "#pk": "PK",
      "#sk": "user_id",
      "#nam":"name",
      "#st":"status"
    },
    ExpressionAttributeValues: {
      ":pk": userPK,
      ":sk": phoneNumber
     

    }
  }
const userr = await doc.query(paramss).promise();
console.log("user length: "+userr.Items.length)
if(userr.Items.length === 0){
    return Responses._200({
        message:"This phone number doesn't exist",
        
    })
}
const userInfo = userr.Items[0]
const {name:driverName,image,is_cnic_verified,is_license_verified,is_phone_verified,cnic,user_id,gender,status,driver_info} = userInfo
let userType = ""
let data = {}
if(status === "user"){
    userType = "Passenger"
     data = {
        username: driverName,
        phone_no:user_id,
        userType:userType,
        gender: gender,
        cnic: cnic,
        image:image,
        is_cnic_verified: is_cnic_verified,
        is_license_verified:is_license_verified,
        is_phone_verified:is_phone_verified,
    
    }
}else{
    userType = "Driver"
     data = {
        username: driverName,
        phone_no:user_id,
        userType:userType,
        gender: gender,
        cnic: cnic,
        image:image,
        is_cnic_verified: is_cnic_verified,
        is_license_verified:is_license_verified,
        is_phone_verified:is_phone_verified,
        driver_info: driver_info
    
    }
}

return Responses._200({
    message:"SUCCESS",
    data:data
})

}catch(error){
    console.log("error: "+error.message)
    return Responses._400({
        message:error.message
    })
  }
  }