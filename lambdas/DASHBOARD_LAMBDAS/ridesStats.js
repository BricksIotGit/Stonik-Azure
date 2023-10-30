const Responses = require("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const tableName = process.env.driverPostedRidesTableName;

exports.handler = async event => {
try{
  const active = `ACTIVE`
const paramsActive = {
    TableName : tableName,
    IndexName: "sortStatus",
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames:{
      "#pk": "PK",
      "#sk": "ride_status"
    },
    ExpressionAttributeValues: {
      ":pk": "Rides",
      ":sk": active

    }
  }
  const activeRidesResult = await doc.query(paramsActive).promise();
  let activeRides = [];
  let activeRidesCount = 0 
  for(let i=0; i<activeRidesResult.Items.length; i++){
          console.log("Enter: "+activeRidesResult.Items)
          activeRides.push(activeRidesResult.Items[i])
          activeRidesCount++
  }
  const onGoing = `OnGoing`
const paramsOnGoing = {
    TableName : tableName,
    IndexName: "sortStatus",
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames:{
      "#pk": "PK",
      "#sk": "ride_status"
    },
    ExpressionAttributeValues: {
      ":pk": "Rides",
      ":sk": onGoing

    }
  }
  const onGoingRidesResult = await doc.query(paramsOnGoing).promise();
  let onGoingRides = [];
  let onGoingRidesCount = 0 
  for(let i=0; i<onGoingRidesResult.Items.length; i++){
          console.log("Enter: "+onGoingRidesResult.Items)
          onGoingRides.push(onGoingRidesResult.Items[i])
          onGoingRidesCount++
  }
  const completed = `COMPLETED`
const paramsCompleted = {
    TableName : tableName,
    IndexName: "sortStatus",
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames:{
      "#pk": "PK",
      "#sk": "ride_status"
    },
    ExpressionAttributeValues: {
      ":pk": "Rides",
      ":sk": completed

    }
  }

  const completedRidesResult = await doc.query(paramsCompleted).promise();
  let completedRides = [];
  let completedRidesCount = 0 
  for(let i=0; i<completedRidesResult.Items.length; i++){
          console.log("Enter: "+completedRidesResult.Items)
          completedRides.push(completedRidesResult.Items[i])
          completedRidesCount++
  }

  return Responses._200({
      message:"SUCCESS",
      data:{
        total_active_rides: activeRidesCount,
        total_on_going_rides: onGoingRidesCount,
        comleted_rides: completedRidesCount
      }
  })
  
  

}catch(error){
    console.log("error: "+error.message)
    return Responses._400({
        message:error.message
    })
}
}
