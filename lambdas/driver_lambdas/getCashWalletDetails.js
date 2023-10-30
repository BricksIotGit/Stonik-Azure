"use strict";
const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});

  const eWalletTableName = process.env.eWalletTableName;
exports.handler = async event =>{
    try{
    const user_id = event.pathParameters.user_id    
    const params = {
        TableName: eWalletTableName,
        KeyConditionExpression: '#pk = :pk and #sk = :sk',
        ExpressionAttributeNames:{
          "#pk": "PK",
          "#sk": "SK"
        },
        ExpressionAttributeValues: {
          ":sk": user_id,
          ":pk":"CashWallet"
        }
    }
    const cashHistoryParams = {
        TableName: eWalletTableName,
        ProjectionExpression: "created_at , amount",
        KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
        ExpressionAttributeNames:{
          "#pk": "PK",
          "#sk":"SK"
        },
        ExpressionAttributeValues: {
          ":sk": user_id,
          ":pk":"CashTransaction"
        }
    }

    const cashWalletDetails = await doc.query(params).promise()
    const cashWalletHistoryDetails = await doc.query(cashHistoryParams).promise()
    const data = {
        total_earnings: cashWalletDetails.Items[0].total_earnings,
        payable: cashWalletDetails.Items[0].payable,
        cashPayedHistory:cashWalletHistoryDetails.Items
    }

    

    return Responses._200({
        message: "SUCCESS",
        data:data
    })

    }catch(error){
        return Responses._400({
            message:error.message
        })
    }


}