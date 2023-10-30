"use strict";
const Responses = require("../HELPER_CLASSES/API_RESPONSES");
import * as AWS from "aws-sdk";
import * as SNS from "../SNS/sns"

const s3 = new AWS.S3();
var crypto = require("crypto");
const ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const doc = new AWS.DynamoDB.DocumentClient({ regin: "us-east-1" });
const axios = require("axios");
const url =
  "https://payments.bankalfalah.com/mVisaAcq/AlfaPay.svc/GenerateQRString";
const secretKey =
  "88moQHxKJbtvFzk4yqF7CAwgeGyMYVakbSNPjPOKWIQYB6xgikjqf5caaQiVqgQ";
const mUserID = "BricksIOT_QR";
const mPassword = "Alf@Brick$#1";
const mTransactionID = "B1";
const mCompanyID = "11";
const mProductID = "22";
const mOrderID = "B1";
const stateMachineArn =
  "arn:aws:states:us-east-1:539072981953:stateMachine:activateQRCode";
let mMarchantPAN = "";
let isPanStatusChanged = false;
const tableName = process.env.qrgeneratedData;

exports.handler = async (event) => {
  try {
    // 1) get passenger id jo phone number ha {amount,user_id} below

    const { amount, driver_id } = JSON.parse(event.body);

    console.log("driver_ID is: ", driver_id);

    const notificationToken = await getNotificationToken(driver_id);

    const saveNotificationToken = await saveNotificatoinTokenDB(
      driver_id,
      notificationToken
    );

    console.log("saveNotificationToken is: ", saveNotificationToken);

    // const getTNTNotification = await getNotificationTokenFromTNT();
    // console.log("Notification ID from TNT: ", getTNTNotification);
    // const sendNotificationToTheDriver = await sendNotificationToTheDriverOnly(
    //   getTNTNotification,
    //   amount
    // );
    // console.log("sendNotificationToTheDriver ", sendNotificationToTheDriver);

    const marchantPans = await getMarchantPAN();
    if (marchantPans.length > 0) {
      mMarchantPAN = marchantPans[0].SK;
      isPanStatusChanged = true;

      const concatenatedString =
        mUserID +
        "+" +
        mPassword +
        "+" +
        mMarchantPAN +
        "+" +
        mCompanyID +
        "+" +
        mProductID +
        "+" +
        mOrderID +
        "+" +
        amount +
        "+" +
        mMarchantPAN;
      var hmac = crypto.createHmac("sha256", secretKey);
      const data = hmac.update(concatenatedString);
      const dataHash = data.digest("hex");

      const body = {
        UserId: mUserID,
        Password: mPassword,
        TransactionId: mMarchantPAN,
        CompanyId: mCompanyID,
        ProductId: mProductID,
        OrderId: mOrderID,
        Amount: amount,
        MerchantPAN: mMarchantPAN,
        DataHash: dataHash,
      };

      const { qrcode, responseCode, responseDesc } = await getData(url, body);
      if (responseCode === "00") {
        await updateMarchantPanStatus("occupied", mMarchantPAN);
        const params = {
          TableName: tableName,
          Item: {
            PK: `QRData`,
            SK: mMarchantPAN,
            UserId: mUserID,
            Password: mPassword,
            TransactionId: mMarchantPAN,
            CompanyId: mCompanyID,
            ProductId: mProductID,
            OrderId: mOrderID,
            Amount: amount,
            MerchantPAN: mMarchantPAN,
            DataHash: dataHash,
          },
        };
        await doc.put(params).promise();
        const stateMachineParams = {
          stateMachineArn: stateMachineArn,
          input: JSON.stringify({
            merchantPAN: mMarchantPAN,
          }),
        };
        // attaching Job to the step function
        await new AWS.StepFunctions()
          .startExecution(stateMachineParams)
          .promise();
        return Responses._200({
          message: "SUCCESS",
          data: {
            QRCode: qrcode,
            ResponseCode: responseCode,
            ResponseDesc: responseDesc,
          },
        });
      } else {
        //await updateMarchantPanStatus("active",mMarchantPAN)
        return Responses._400({
          message: responseDesc,
        });
      }
    } else {
      return Responses._200({
        message: "Transaction ID is engaged, pleas wait for ≈120sec ",
      });
    }
  } catch (error) {
    if (isPanStatusChanged) {
      await updateMarchantPanStatus("active", mMarchantPAN);
    }
    return Responses._400({
      message: error.message,
    });
  }
};

const getData = async (url, body) => {
  console.log("Called");
  const response = await axios.post(url, body);
  console.log(response.data);
  const { QRCode, ResponseCode, ResponseDesc } = response.data;
  console.log("qrcode: " + QRCode);
  console.log("responseCode: " + ResponseCode);
  console.log("responseDescription: " + ResponseDesc);

  return {
    qrcode: QRCode,
    responseCode: ResponseCode,
    responseDesc: ResponseDesc,
  };
};

const getMarchantPAN = async () => {
  const tableName = process.env.marchantpan;
  const params = {
    TableName: tableName,
    IndexName: "sortByStatus",
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :sk)",
    ExpressionAttributeNames: {
      "#pk": "PK",
      "#sk": "status",
    },
    ExpressionAttributeValues: {
      ":pk": "PAN",
      ":sk": "active",
    },
  };
  const marchantPans = await doc.query(params).promise();
  console.log("MarchantPan: " + marchantPans.Items);
  return marchantPans.Items;
};

const getNotificationToken = async (driver_ID) => {
  const tableName = process.env.userTableName;
  var params = {
    TableName: tableName,
    KeyConditionExpression: "#pk= :pk and #user_id = :user_id",
    ExpressionAttributeNames: {
      "#pk": "PK",
      "#user_id": "user_id",
    },
    ExpressionAttributeValues: {
      ":pk": "User",
      ":user_id": driver_ID,
    },
  };

  const data = await doc.query(params).promise();
  //console.log("data data: " , data);

  const { notification_token } = (await doc.query(params).promise()).Items[0];

  console.log("Notification ID: ", notification_token);
  return notification_token;
};

const saveNotificatoinTokenDB = async (driver_id, notification_token) => {
  try {
    const tableName = process.env.transactionNotificationTable;
    const params = {
      TableName: tableName,
      Item: {
        PK: "CurrentUser",
        SK: `NONE`,
        notification_token,
        driver_id,
      },
    };

    await doc.put(params).promise();

    return Responses._200({
      message: "SUCCESS",
    });
  } catch (error) {
    return Responses._400({
      message: error.message,
    });
  }
};

const getNotificationTokenFromTNT = async () => {
  const tableName = process.env.transactionNotificationTable;
  var params = {
    TableName: tableName,
    KeyConditionExpression: "#pk= :pk and #sk = :sk",
    ExpressionAttributeNames: {
      "#pk": "PK",
      "#sk": "SK",
    },
    ExpressionAttributeValues: {
      ":pk": "CurrentUser",
      ":sk": "NONE",
    },
  };

  const data = await doc.query(params).promise();
  //console.log("data data: " , data);

  const { notification_token } = (await doc.query(params).promise()).Items[0];

  return notification_token;
};

const updateMarchantPanStatus = async (status, marchantPan) => {
  const tableName = process.env.marchantpan;
  let params = {
    TableName: tableName,
    Key: {
      PK: "PAN",
      SK: marchantPan,
    },
    UpdateExpression: "set #pan_status = :pan_status",
    ExpressionAttributeNames: {
      "#pan_status": "status",
    },
    ExpressionAttributeValues: {
      ":pan_status": status,
    },
    ReturnValues: "UPDATED_NEW",
  };
  await doc.update(params).promise();
};

const sendNotificationToTheDriverOnly = async (notification_token, amount) => {
  try {
    var message = Responses._data_msg_notification(
      "Payment Received",
      "Rs." + amount + " has been added to your account.",
      "payment_received",
      null
    );
    var applicationArn = await SNS.platformEndpoint(notification_token);
    await SNS.publishToTheDevice(applicationArn, JSON.stringify(message));

    return "SNS OK";
  } catch (error) {
    return Responses._400({
      message: error.message,
    });
  }
};
