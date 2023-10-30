const Responses = require("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const tableName = process.env.bantloTableName;
exports.handler = async event => {

    const id= event.pathParameters.id;

    var params = {
        TableName : tableName,
        ProjectionExpression:"id,total_earnings,withdrawable_amount,withdrawal_history",
        KeyConditionExpression: "#pk = :pk and #sk=:sk",
        ExpressionAttributeNames:{ 
            "#pk": "PK",
            "#sk":"SK"
        },
        ExpressionAttributeValues: {
            ":pk": "EWALLET",
            ":sk":`QR#${id}`
           
        }
    };
    try{

        const result = await doc.query(params).promise()
        const items =  result.Items
        const count = result.Items.length
        return Responses._200(items)

    }catch(err){
        return Responses._400({
            message:`Error occured${err.message}`
        })
    }



}