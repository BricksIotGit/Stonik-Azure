const Responses = require("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
import { Console } from 'console';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
exports.handler = async event => {
try{

  const userID = event.pathParameters.id;
  const paramss = {
    TableName : process.env.notificationTable,
    KeyConditionExpression: '#pk = :pk',
    ExpressionAttributeNames:{
      "#pk": "PK"
    },
    ExpressionAttributeValues: {
      ":pk": userID
    }
  }
  const notifications = await doc.query(paramss).promise();
  let notificationsList = []
  for(let i=0; i<notifications.Items.length; i++){
      const obj = {
          title: notifications.Items[i].title,
          message: notifications.Items[i].message,
          click_action: notifications.Items[i].click_action,
          date: notifications.Items[i].created_at
      }
      notificationsList.push(obj)
  }
  
  return Responses._200({
      message: "SUCCESS",
      data: notificationsList
  })

}catch(error){
    return Responses._400({
        message:error.message
    })
}
}