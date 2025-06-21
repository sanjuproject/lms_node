const jwt = require('jsonwebtoken');
const db = require('../services/db');
const jwt_decode = require('jwt-decode');
const config = require('../config');
async function validateToken(req, res, next){
	let response = {};
	let status = 400;
	let message = "Your session is expired.";
	if (req.headers.authorization) {

		let quest_data = req.body;
		for (var i in quest_data) {

					if(quest_data[i] == undefined || quest_data[i] === undefined || quest_data[i] === null)
					{
						response = {status: status, msg: "Internet Error.Off line.Try Again.",data:[]};
						res.json(response);
					}
				}
		const authHeader = req.headers.authorization;
		let token = authHeader.split(" ")[1];
		let decodetoken = jwt_decode(token);
		if(decodetoken.id === 0)
		{
			next();
		}
		else
		{
				await db.query("select * from `logindevices` where `login_token` ='"+token+"' and `userid` = "+decodetoken.id)
				.then((result)=>{	
					if(result.length > 0)
					{
							jwt.verify(token, config.jwttoken, (err, user) => {
								if (err) {
									//console.log("invalid token");
									response = {status: status, msg: message};
									res.json(response);
								}
								else{
								req.user = user;
								next();
								}
							});
					}
					else
					{
						response = {status: status, msg: "Invalid token"};
						res.json(response);
					}
				});
		}
	}
	else{
		response = {status: status, msg: message};
		res.json(response);
	}
}

module.exports = {
  validateToken
}