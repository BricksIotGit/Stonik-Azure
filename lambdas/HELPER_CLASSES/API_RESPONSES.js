const Responses = {

    _200(data={}){
        return {
            headers: {
                'Content-Type':'application/json',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Origin':'*',
            },
            statusCode:200,
            isBase64Encoded:false,
            body:JSON.stringify(data)
        }
    },


    _400(data={}){
        return {
            headers: {
                'Content-Type':'application/json',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Origin':'*',
            },
            statusCode:400,
            isBase64Encoded:false,
            body:JSON.stringify(data)
        }
    },

    _messageFormat(title,body,action,status){
        return{ 
            default: JSON.stringify("Default Message"),
            GCM: JSON.stringify({
                data: {
                    title:title,
                    body:body,
                    action:action,
                    status:status
          }
        })}
    },
    _data_msg_notification(title,body,action,data){
        return{ 
            default: JSON.stringify("Default Message"),
            GCM: JSON.stringify({
                data: {
                    title:title,
                    body:body,
                    action:action,
                    payload:data
          }
        })}
    },
    _data_msg_action(action){
        return{ 
            default: JSON.stringify("Default Message"),
            GCM: JSON.stringify({
                data: {
                    action:action
          }
        })}
    },
    _verifyDriverInfoNotification(title,body,status,action){
        return{ 
            default: JSON.stringify("Default Message"),
            GCM: JSON.stringify({
                notification: {
                    title:title,
                    body:body,
                    click_action:action
                },
                data:{
                    status: status
                }
    })
}
    },
    
    _notficationFormat(title,body,action){
        return{ 
            default: JSON.stringify("Default Message"),
            GCM: JSON.stringify({
                notification: {
                    title:title,
                    body:body,
                    click_action:action
                }
    })
}
    }
    
};


module.exports = Responses