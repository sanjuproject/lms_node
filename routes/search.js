const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const exam_scholastic = require('../services/exam_scholastic_subscribtion_master.js');
const exam_competitive = require('../services/exam_competitive_subscribtion_master.js');
const addtocart_subscription = require('../services/addtocart_subscription.js');
const purchased_subscribtions = require('../services/purchased_subscribtions.js');
const exam_completed = require('../services/exam_completed.js');
const helper = require('../helper.js');
const { config } = require('dotenv');
const configdata  = require('../config.js');
const db = require('../services/db.js');
const questions = require('../services/questions.js');

//Search Questions for elibrary section against particular subject
router.post('/searchquestions',adminMiddleware.validateToken , async function(req, res, next){
	try{
		res.json(await questions.searchexamsquestions(req.body,req.user));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
module.exports = router;