const Responses = require("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from 'aws-sdk';
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const tableName = process.env.userTableName;

exports.handler = async event => {
try{
  const passengers = `user`
const paramsPassengers = {
    TableName : tableName,
    IndexName: "sortByStatus",
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames:{
      "#pk": "PK",
      "#sk": "status"
    },
    ExpressionAttributeValues: {
      ":pk": "User",
      ":sk": passengers

    }
  }
  const passengersResult = await doc.query(paramsPassengers).promise();  
  let totalPassengers = []
  let passengerCount = 0
  for(let i=0; i<passengersResult.Items.length; i++){
    console.log("Enter: "+passengersResult.Items)
    totalPassengers.push(passengersResult.Items[i])
    passengerCount++
}

const waitingForApproval = `waiting_for_approval`
const paramsWaitingForApproval = {
    TableName : tableName,
    IndexName: "sortByStatus",
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames:{
      "#pk": "PK",
      "#sk": "status"
    },
    ExpressionAttributeValues: {
      ":pk": "User",
      ":sk": waitingForApproval

    }
  }
  const waitingForApprovalResult = await doc.query(paramsWaitingForApproval).promise();  
  let totalWaitingForApproval = []
  let waitingForApprovalCount = 0
  for(let i=0; i<waitingForApprovalResult.Items.length; i++){
    console.log("Enter: "+waitingForApprovalResult.Items)
    totalWaitingForApproval.push(waitingForApprovalResult.Items[i])
    waitingForApprovalCount++
}

const approved = `approved`
const paramsaApproved = {
    TableName : tableName,
    IndexName: "sortByStatus",
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames:{
      "#pk": "PK",
      "#sk": "status"
    },
    ExpressionAttributeValues: {
      ":pk": "User",
      ":sk": approved

    }
  }
  const approvedResult = await doc.query(paramsaApproved).promise();  
  let totalApproved = []
  let approvedCount = 0
  for(let i=0; i<approvedResult.Items.length; i++){
    console.log("Enter: "+approvedResult.Items)
    totalApproved.push(approvedResult.Items[i])
    approvedCount++
}

const notApproved = `not_approved`
const paramsNotApproved = {
    TableName : tableName,
    IndexName: "sortByStatus",
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames:{
      "#pk": "PK",
      "#sk": "status"
    },
    ExpressionAttributeValues: {
      ":pk": "User",
      ":sk": notApproved

    }
  }
  const notApprovedResult = await doc.query(paramsNotApproved).promise();  
  let totalNotApproved = []
  let notApprovedCount = 0
  for(let i=0; i<notApprovedResult.Items.length; i++){
    console.log("Enter: "+notApprovedResult.Items)
    totalNotApproved.push(notApprovedResult.Items[i])
    notApprovedCount++
}

    let total_number_of_users = passengerCount+approvedCount+notApprovedCount+waitingForApprovalCount
    let total_passengers = passengerCount
    let total_approved_drivers = approvedCount
    let total_not_approved_drivers = notApprovedCount
    let total_waiting_for_approval_drivers = waitingForApprovalCount

    let data = {
        total_number_of_users,
        total_passengers,
        total_approved_drivers,
        total_not_approved_drivers,
        total_waiting_for_approval_drivers
       }

  console.log("data: "+data)
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