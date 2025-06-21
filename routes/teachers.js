const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const teacher = require('../services/teachers.js');

//Teacher registration
router.post('/registration', async function(req, res, next){
	try{
		res.json(await teacher.create(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
//Teacher login
router.post('/login', async function(req, res, next){
	try{
		res.json(await teacher.signin(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

module.exports = router;