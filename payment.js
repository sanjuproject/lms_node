const fs = require('fs')
const express = require('express')
var cors = require('cors');
const db = require('./services/db.js');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
// block:start:importing-sdk
const { Juspay, APIError } = require('expresscheckout-nodejs')
// block:end:importing-sdk

/**
 * Setup expresscheckout-node sdk
 */
const SANDBOX_BASE_URL = "https://smartgatewayuat.hdfcbank.com"
const PRODUCTION_BASE_URL = "https://smartgateway.hdfcbank.com"



/**
 * Read config.json file
 */
const config = require('./config.json')
const path = require('path')
const publicKey = fs.readFileSync(config.PUBLIC_KEY_PATH)
const privateKey = fs.readFileSync(config.PRIVATE_KEY_PATH)
const paymentPageClientId = config.PAYMENT_PAGE_CLIENT_ID // used in orderSession request
const port = process.env.PORT || 4000
/*
Juspay.customLogger = Juspay.silentLogger
*/
const juspay = new Juspay({
    merchantId: config.MERCHANT_ID,
    baseUrl: SANDBOX_BASE_URL,
    jweAuth: {
        keyId: config.KEY_UUID,
        publicKey,
        privateKey
    }
})


//app.use(express.urlencoded({ extended: true }))

/**
 * route:- initiateJuspayPayment
 */

// block:start:session-function
router.post('/initiateJuspayPayment', async (req, res) => {
    const orderId = `${Date.now()}`;
    const amount = req.body.amount;
    const customer_id = req.body.student_id;
    const email = req.body.student_email;
    const phone = req.body.student_phone;
    const trans_id = customer_id + Date.now();

    let total_cart_amount = 0;
    let sql_cart_amout = "select * from `addtocart_subscription` where `student_id` = "+customer_id;
    await db.query(sql_cart_amout)
    .then(async result=>{
        result.forEach(Element=>{
            total_cart_amount += parseFloat(Element.payment_amount);
        })
    })
	
	await db.query("delete from interm_trans_data where `student_id` = "+customer_id);

	let sql = "INSERT INTO `interm_trans_data`(`order_id`, `trans_id`, `student_id`, `cart_amount`) VALUES ('"+orderId+"','"+trans_id+"','"+customer_id+"','"+total_cart_amount+"')";

	await db.query(sql);

    // makes return url
    const returnUrl = `${req.protocol}://${req.hostname}:${port}/handleJuspayResponse`

    try {
        const sessionResponse = await juspay.orderSession.create({
            order_id: orderId,
            amount: amount,
            payment_page_client_id: paymentPageClientId,                    // [required] shared with you, in config.json
            customer_id: "HDFC-"+customer_id,                       // [optional] your customer id here
            action: 'paymentPage',                                          // [optional] default is paymentPage
            return_url: returnUrl,                                          // [optional] default is value given from dashboard
            currency: 'INR',
            customer_email:email,
            customer_phone:phone                                                 // [optional] default is INR
        })

        // removes http field from response, typically you won't send entire structure as response
        return res.json(makeJuspayResponse(sessionResponse))
    } catch (error) {
        if (error instanceof APIError) {
            // handle errors comming from juspay's api
            return res.json(makeError(error.message))
        }
        return res.json(makeError())
    }
})
 // block:end:session-function

// block:start:order-status-function
router.post('/handleJuspayResponse', async (req, res) => {
    const orderId = req.body.order_id || req.body.orderId

    if (orderId == undefined) {
        return res.json(makeError('order_id not present or cannot be empty'))
    }
    try {
        const statusResponse = await juspay.order.status(orderId)
        const orderStatus = statusResponse.status
        let message = ''
        switch (orderStatus) {
            case "CHARGED":
                message = "order payment done successfully"
                break
            case "PENDING":
            case "PENDING_VBV":
                message = "order payment pending"
                break
            case "AUTHORIZATION_FAILED":
                message = "order payment authorization failed"
                break
            case "AUTHENTICATION_FAILED":
                message = "order payment authentication failed"
                break
            default:
                message = "order status " + orderStatus
                break
        }
        console.log("=======MESSAGE====",message);

        // removes http field from response, typically you won't send entire structure as response
        const final_response = makeJuspayResponse(statusResponse);
        //console.log(final_response);
        let query_param_data = {};
        query_param_data['billing_email'] = final_response.customer_email;
        query_param_data['billing_tel'] = final_response.customer_phone;
        query_param_data['order_id'] = final_response.order_id;
        query_param_data['amount'] = final_response.amount;
        query_param_data['bank_ref_no'] = final_response.txn_id;
        query_param_data['tracking_id'] = final_response.payment_gateway_response.epg_txn_id;
        query_param_data['payment_mode'] = final_response.payment_method_type;
        query_param_data['card_name'] = final_response.card.card_brand;
        query_param_data['currency'] = final_response.currency;
        query_param_data['trans_date'] = final_response.date_created;
        query_param_data['order_status'] = final_response.status;

 ///////////////////////////////////////////////       
let data = new FormData();
data.append('payment_details', JSON.stringify(query_param_data));

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: process.env.PORTALURL+'payment_gateway/paymentresponseHandaler_mobile.php',
  headers: { 
    ...data.getHeaders()
  },
  data : data
};

axios.request(config)
.then((response) => {
//console.log(response.data);
})
.catch((error) => {
  console.log(error);
});
///////////////////////////////////////////////////
        return res.send(final_response);
    } catch(error) {
        if (error instanceof APIError) {
            // handle errors comming from juspay's api,
            //return res.json(makeError(error.message))
        }
        //return res.json(makeError())
    }
})
// block:end:order-status-function


// Utitlity functions
function makeError(message) {
    return {
        message: message || 'Something went wrong'
    }
}

function makeJuspayResponse(successRspFromJuspay) {
    if (successRspFromJuspay == undefined) return successRspFromJuspay
    if (successRspFromJuspay.http != undefined) delete successRspFromJuspay.http
    return successRspFromJuspay
}

module.exports = router;