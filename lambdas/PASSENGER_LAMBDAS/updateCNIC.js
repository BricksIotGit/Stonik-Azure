const Responses = require ("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const s3 = new AWS.S3(); 
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
exports.handler = async event => {
    const parsedBody = JSON.parse(event.body);
    console.log(parsedBody)
    const {id,cnic} = parsedBody;
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
        UpdateExpression: "set cnic=:nic",
        ExpressionAttributeValues:{
            ":nic":cnic
        },
        ReturnValues:"UPDATED_NEW"
    };
  
    await doc.update(params).promise();
    console.log("Succcess fully updated CNIC")
            return Responses._200({
                message:"SUCCESS"
            })
    }catch(error){
        console.log("error: "+error.message)
        return Responses._400({
            message:error.message
        })
    }

}