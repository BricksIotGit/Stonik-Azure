const Responses = require("../HELPER_CLASSES/API_RESPONSES");
var http = require('http');
const ipify = require('ipify2');
import * as AWS from 'aws-sdk';
import * as SNS from "../SNS/sns"
import { Console } from 'console';
import { userInfo } from 'os';
var crypto = require('crypto');
const ddb = new AWS.DynamoDB ({apiVersion: '2012-08-10'});
const doc = new AWS.DynamoDB.DocumentClient({regin:'us-east-1'});
const mUserID = "BricksIOT_QR"
const mPassword = "Alf@Br!cksIO#1"

const secretKey = "MyTGfmAszY5fG0CHRWTl5945f95s2HIO" 

const notification_token = "eR2wzoc3T_iQ7lbGzjNviF:APA91bH5lPaWaH_y5EvvI2lLExQHkNfqlEXe58uckOLHQktz8H7z06pMYdmbPaTrpVeX9ZLg8DdAUJUIiaFFq099NcPgyTul_HMU6aJgET9J-tdWOp1XPnsIV1Izc6BRKbZCIsLnR6R-"

exports.handler = async event => {
try{

    var myIP = await ipify.ipv4()
    console.log("IP: ",myIP)

// http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
//   resp.on('data', function(ip) {
//     console.log("My public IP address is: " + ip);
//        });
//    });
 
    const body = JSON.parse(event.body)
    const {UserId,Password,STAN,P2M_ID,MerchantPAN,ICA,TransactionAmount,DataHash} = JSON.parse(event.body)
    
    if(UserId === "" || Password === "" || STAN === 0 || P2M_ID === "" || MerchantPAN === "" || TransactionAmount === "" || DataHash ===""){
        return Responses._400({
            ResponseCode:"03",
            ResponseDescription: "REQUIRED_FIELD_MISSING"
        })
    }
    if(!(body.hasOwnProperty("UserId")) ||
    !(body.hasOwnProperty("Password")) ||
    !(body.hasOwnProperty("STAN")) ||
    !(body.hasOwnProperty("P2M_ID")) ||
    !(body.hasOwnProperty("MerchantPAN")) ||
    !(body.hasOwnProperty("TransactionAmount")) ||
    !(body.hasOwnProperty("DataHash"))){
        console.log("error code: 03")
        console.log("error desc: REQUIRED_FIELD_MISSING")
        return Responses._400({
            ResponseCode:"03",
            ResponseDescription: "REQUIRED_FIELD_MISSING"
        })
    }
    console.log("Deploy: 1")
    console.log("UserID: "+UserId)
    console.log("Password: "+Password)
    console.log("STAN: "+STAN)
    console.log("P2M_ID: "+P2M_ID)
    console.log("MerchantPAN: "+MerchantPAN)
    console.log("TransactionAmount: "+TransactionAmount)
    console.log("DataHash: "+DataHash)

    const concatenatedString = UserId+"+"+Password+"+"+STAN+"+"+P2M_ID+"+"+MerchantPAN+"+"+ICA+"+"+TransactionAmount;
    var hmac = crypto.createHmac('sha256', secretKey);
    const data = hmac.update(concatenatedString);
    const dataHash= data.digest('hex');

    if(dataHash !== DataHash){
        console.log("error code: 01")
        console.log("error desc: INVALID_ERROR in hash")
        return Responses._400({
            ResponseCode:"01",
            ResponseDescription: "INVALID_ERROR"
        })
    }


    // 1) Notification to driver
    // 2) Notification to passenger
    // 3) add amount to the driver //done below
    // 4) update merchanypan //done below

    const getTNTNotification = await getNotificationTokenFromTNT();
    console.log("Notification ID from TNT: ", getTNTNotification);
    const sendNotification = await sendNotificationToTheDriver(
      getTNTNotification,
      TransactionAmount
    );
    console.log("sendNotificationToTheDriver ", sendNotification);


    await updateMarchantPanStatus("active",MerchantPAN)
    await addTransactionDetails(UserId,Password,STAN,P2M_ID,MerchantPAN,ICA,TransactionAmount,DataHash)
    
    console.log("error code: 00")
    console.log("error desc: SUCCESS")
    return Responses._200({
      
        ResponseCode:"00",
        ResponseDescription: "SUCCESS"
    })
    
    // Now let the passenger know about the successfull transection, do the stuff here
    
    
    
}catch(error){
    console.log("error: "+error.message)
    return Responses._400({
        message:error.message
    })
}
}

const getData = async (url) => {
    console.log("Called");
    const response = await axios.get(url);
    console.log(response);
 
};
const getNotificationToken = async (marchantPan) => {
    const tableName = process.env.qrgeneratedData
    const params = {
        TableName : tableName,
        KeyConditionExpression: '#pk = :pk and #sk= :sk',
        ExpressionAttributeNames:{
          "#pk": "PK",
          "#sk": "SK"
        },
        ExpressionAttributeValues: {
          ":pk": "QRData",
          ":sk": marchantPan
    
        }
      }
      const pans = await doc.query(params).promise()
      return pans.Items
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

  const addTransactionDetails = async (UserId,Password,STAN,P2M_ID,MerchantPAN,ICA,TransactionAmount,DataHash)=>{
    const createdAt = Date()
    const params = {
        TableName: `${process.env.transactionNotificationTable}`,
        Item:{
            PK:`Transaction`,
            SK:STAN,
            UserId:UserId,
            Password:Password,
            STAN: STAN,
            P2M_ID:P2M_ID,
            MerchantPAN:MerchantPAN,
            ICA:ICA,
            TransactionAmount:TransactionAmount,
            DataHash:DataHash,
            created_at:createdAt,
           
        }
  }
  await doc.put(params).promise()
}
const sendNotificationToTheDriver = async (notification_token,amount) =>{
    var message = Responses._data_msg_notification("Payment Received","Rs."+amount+" has been added to your account.","payment_received",null)
    var applicationArn = await SNS.platformEndpoint(notification_token)
    await SNS.publishToTheDevice(applicationArn,JSON.stringify(message))
}

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