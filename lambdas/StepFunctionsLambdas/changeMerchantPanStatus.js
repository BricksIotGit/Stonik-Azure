const Responses = require("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import { Console } from 'console';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});

exports.handler = async event => {
try{
    
    const merchantPAN = event.Input.merchantPAN
    console.log("MerchantPAN: "+merchantPAN)
    await updateMarchantPanStatus("active",merchantPAN)    
    
}catch(error){
    console.log("error:"+error.message)
}
}
const updateMarchantPanStatus = async (status,marchantPan)=>{
    const tableName = process.env.marchantpan
    let params = {
      TableName:tableName,
      Key:{
          "PK": "PAN",
          "SK": marchantPan
      },
      UpdateExpression: "set #pan_status = :pan_status",
      ExpressionAttributeNames:{
          "#pan_status": "status",
         
      },
      ExpressionAttributeValues:{
          ":pan_status":status
      },
      ReturnValues:"UPDATED_NEW"
  };
    await doc.update(params).promise()
  }