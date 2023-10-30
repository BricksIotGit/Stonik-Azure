"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');
  const eWalletTableName = process.env.eWalletTableName;
exports.handler = async event =>{
    try{
    const parsedBody = JSON.parse(event.body);
    const {user_id,earned_amount} = parsedBody
    const transactionID = uuidv1()
    var currentDate = new Date();
    const currentDateStamp = currentDate.toLocaleString("PKT",{timeZone:"Asia/Karachi"});
    
    const params = {
        TableName: process.env.eWalletTableName,
        KeyConditionExpression: '#pk = :pk and #sk = :sk',
        ExpressionAttributeNames:{
          "#pk": "PK",
          "#sk":"SK"
        },
        ExpressionAttributeValues: {
          ":sk": user_id,
          ":pk":"CashWallet"
        }
    }

    const cashWalletDetails = await doc.query(params).promise()
    const totalEarningAmount = cashWalletDetails.Items[0].total_earnings
    const grandTotal = totalEarningAmount + earned_amount
    const payableAmount = (20/100)*(grandTotal);

     var updateTotalEarningsParams = {
        TableName: eWalletTableName,
        Key:{
            "PK": "CashWallet",
            "SK": user_id
        },
        UpdateExpression: "set total_earnings = :grandTotal, payable = :payableAmount",
        ExpressionAttributeValues:{
            ":grandTotal":grandTotal,
            ":payableAmount": payableAmount
        },
        ReturnValues:"UPDATED_NEW"
    };

    await doc.update(updateTotalEarningsParams).promise()

    const transactionParams = {
      TableName:eWalletTableName,
      Item:{
        PK:"CashTransaction",
        SK:`${user_id}#${transactionID}`,
        transaction_id: transactionID,
        amount: earned_amount,
        created_at: currentDateStamp
      }
    }

    await doc.put(transactionParams).promise()

    

    return Responses._200({
        message: "SUCCESS"
    })

    }catch(error){
        return Responses._400({
            message:error.message
        })
    }


}