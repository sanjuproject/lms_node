/*
All required packages, libraries and modules are imported here
*/
const mysql = require('mysql2/promise');
const express = require('express');
const router = express.Router();
const admin = require('../services/admin.js');
const exam_category = require('../services/exam_category.js');
const boards = require('../services/boards.js');
const branches = require('../services/branches.js');
const chapters = require('../services/chapters.js');
const exam_type = require('../services/exam_type.js');
const adminMiddleware = require('../middleware/admin.js');
const classes = require('../services/classes.js');
const subjects = require('../services/subjects.js');
const question_pattern = require('../services/question_pattern.js');
const exam_set_configuration = require('../services/exam_set_configuration.js');
const exam_subtype = require('../services/exam_subtype.js');
const demo_login = require('../services/demo_student_login.js');
const db = require('../services/db.js');
const jwt = require('jsonwebtoken');
const config = require('../config.js');
const helper = require('../helper.js');
const e_library = require('../services/elibrary.js');
const bcrypt = require('bcryptjs');
const path = require("path");
const multer = require("multer");
const fs = require('fs');
var shortUrl = require("node-url-shortener");
const school_master = require('../services/school_master.js');
const static_data = require('../static_data_json.json');
var CryptoJS = require("crypto-js");
const academic_sessions = require('../services/academic_sessions.js');
const students = require('../services/students.js');
require('dotenv').config();
const moment = require('moment');
const exam_scholastic = require('../services/exam_scholastic_subscribtion_master.js');
const { resume } = require('pdfkit');

// This router is used to get the content of elibrary. Use user token to get the content
router.post('/getelibrarycontent', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await e_library.getconceptmapdetails(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get Demo E-Library content against student details category,class and board. 
router.post('/getelibrarycontent_demo', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await e_library.getconceptmapdetails_demo(req.body, req.user));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

//Student registration. Register a new student against all details from LMS 
router.post('/registration', async function (req, res, next) {
	try {
		await admin.create(req.body)
			.then(async result => {
				if (result.status == 410) {
					res.json(result);
				} else {
					let resultdata = [];
					await db.query("delete from otp_verification_status where email = '" + req.body.email + "'");
					resultdata = await admin.signin(req.body);
					resultdata.msg = result.msg;
					resultdata.studentid = result.studentid;
					res.json(resultdata);
				}
			})

	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
router.post('/student_registration', async function (req, res, next) {
	try {
		await admin.createStudent(req.body)
			.then(async result => {
				if (result.status == 410) {
					res.json(result);
				} else {
					let resultdata = [];
					await db.query("delete from otp_verification_status where email = '" + req.body.email + "'");
					// resultdata = await admin.signin(req.body);
					// resultdata.msg = result.msg;
					// resultdata.studentid = result.studentid;

					res.json(result);

				}
			})

	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
//add first signup data//
router.post('/add_first_signup_data', async function (req, res, next) {
	try {
		res.json(await admin.addFirstSignupData(req.body.student_id, req.body.exam_type));
	} catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
//Check Student record exist or not against email address and mobile no
router.post('/checkuserexist', async function (req, res, next) {
	try {
		res.json(await admin.checkuserexist(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

//Demo Student login. Guest login for stduent done from here. 
//After Login provide a demo token whchich is used to access the call any APIs
router.post('/demologin', async function (req, res, next) {
	try {
		res.json(await demo_login.demologin(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

//Student login. This is the normal login of the student against email and password. 
//This API also provide token along with student details which are use for futher activities.
router.post('/login', async function (req, res, next) {
	try {
		if (req.body) {
			res.json(await admin.signin(req.body));
			//console.log(process.env.GST_RATE)
		} else {
			res.status(200).send({ status: 200, msg: "Login failed" });
		}
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Verify mobile no through OTP
router.post('/verifymobileotp', async function (req, res, next) {
	try {
		res.json(await admin.verify_mobile_otp(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Verify email address through OTP
router.post('/verifyemailotp', async function (req, res, next) {
	try {
		res.json(await admin.verify_email_otp(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Send verification OTP to email and mobile 
router.post('/send_verification_otp', async function (req, res, next) {
	try {
		res.json(await admin.send_verification_otp(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

// Get Exam category list 
router.post('/master/examcategorylist', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await exam_category.getexamcategories());
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

// Get Exam Type name list against category id
router.get('/master/getexamtype', async function (req, res, next) {
	try {
		res.json(await exam_type.getexamtype());
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get Sub Exam Type name list against exam type id
router.post('/getsubexamtype', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await exam_subtype.getexamsubtype_bytype(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

// Get all Sub Exam Type name list
router.get('/master/getexamsubtype', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await exam_subtype.getexamsubtype());
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get all active Board details list
router.get('/master/getboardslist', async function (req, res, next) {
	try {
		res.json(await boards.getboards());
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get Subjects list against category scholastic
router.post('/master/getbranchscholasticlist', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await branches.getbranchesscholastic(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get Subjects list against category competitive
router.post('/master/getbranchcompetitivelist', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await branches.getbranchescompetitive(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get Chapter details list against subject
router.post('/master/getchapterslist', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await chapters.getchapters(req.body, req.user));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get all active classes details list
router.get('/master/getclasseslist', async function (req, res, next) {
	try {
		res.json(await classes.getclasses(req.user));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get all active question pattern details list. No parameter required
router.get('/master/getquestionpattern', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await question_pattern.getpattern());
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get exam configuration details from here.
router.get('/master/getexamconfiguration', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await exam_set_configuration.getsetconfiguration());
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Logout student. No parameter required
router.get('/logout', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await admin.logout());
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get all active exam category details list against student/user id.
// give diffarent status against exam category subscription or exam given by student.
router.get('/getexamcategories', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let userdata = req.user;
		res.json(await exam_category.getexamcategories(userdata));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
//Get exam type details list against student or user id
router.post('/getexamtype', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let userdata = req.user;
		res.json(await exam_type.getexamtype(req.body, userdata));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

// Check token validity or not
router.post('/checktokenvalidity', async function (req, res, next) {
	try {
		const token = req.body.login_token;
		jwt.verify(token, config.jwttoken, (err, user) => {
			if (err) {
				response = { status: 410, msg: "Token expired or invalid" };
				res.json(response);
			}
			else {
				if (req.body.userid != 0) {
					db.query("select * from logindevices where `login_token` = '" + token + "' and `userid` = '" + req.body.userid + "'")
						.then((result) => {
							if (result.length > 0) {
								let resultdata = result[0];
								delete resultdata.id;
								delete resultdata.created_at;
								delete resultdata.usertype;
								response = { status: 200, data: resultdata };
							} else {
								response = { status: 410, msg: "Invalid token" };
							}
							res.json(response);
						})
				} else {
					let resultdata = { "userid": 0, "login_token": token };
					response = { status: 200, data: resultdata };
					res.json(response);
				}
			}
		});

	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});


var storage = multer.diskStorage({
	destination: function (req, file, cb) {

		// Uploads is the Upload_folder_name
		cb(null, process.env.IMAGEUPLOADBASEURL + "assets/images")
	},
	filename: function (req, file, cb) {
		//console.log(file.mimetype.split("/")[1])
		cb(null, "profilepic_" + Date.now() + "." + file.mimetype.split("/")[1])
	}
});

var upload = multer({
	storage: storage,
	fileFilter: function (req, file, cb) {
		// Set the filetypes, it is optional
		var filetypes = /png|jpeg|jpg|PNG/;
		var mimetype = filetypes.test(file.mimetype);

		var extname = filetypes.test(path.extname(
			file.originalname).toLowerCase());

		if (mimetype && extname) {
			return cb(null, true);
		}

		cb("File upload only supports the "
			+ "following filetypes - " + filetypes);
	}
}).single("profile_pic");

async function check_duplicate(data) {
	//console.log(data);
	const check_duplicate = await db.query(`SELECT COUNT(*) as record_num,mobile_otp_verify,email_otp_verify\
	FROM students WHERE is_deleted = 0 and id != '`+ data.student_id + `' and (email = '` + data.email + `' or mobile = '` + data.mobile + `')`);

	let result = await new Promise((resolve, reject) => {
		if (check_duplicate[0].record_num > 0) {
			message = "Sorry! record already exist.";
			response = { status: 410, msg: message }
			reject(response);
		} else {
			message = "Ok";
			response = { status: 200, msg: message }
			resolve(response);
		}
	}).then((value) => {
		//console.log(value);
		return value;
		//
	}).catch((err) => {
		return err;
		//console.error(err);
	});
	return result;
}
//Students profile details updated by student against student ID.
// Students profile details like name, address, email, mobile etc.
router.post('/updatestudentprofile', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let newpassword = "";
		let response_msg = "";
		let querydata = "";
		let standard = 0;
		let previous_class = 0;
		upload(req, res, async function (err) {
			if (req.body.standard != "" && req.body.standard != undefined && req.body.standard != null) {
				await students.call_cronjob_archive_exam(req.body.student_id, req.body.standard - 1)
			} else {
				await db.query("select students.id, students.standard from students left join academic_session on academic_session.id = students.academic_year where students.id = " + req.body.student_id + " and academic_session.is_expired = 2 and academic_session.is_deleted = 0")
					.then(async (result) => {
						if (result.length > 0) {
							let standard = result[0].standard;
							//await db.query("delete from purchased_subscribtions_details where `student_id` = "+req.body.student_id)
							//await db.query("delete from purchased_subscribtions where `student_id` = "+req.body.student_id)
							await students.call_cronjob_archive_exam(req.body.student_id, standard)
						}
					})
			}
			if (err) {
				let data = req.body;

				newpassword = req.body.password;

				if (newpassword == '' || newpassword == undefined || newpassword == null) {

					if (data.standard == "" || data.standard == undefined || data.standard == null) {

						querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`board`=?,`school_name`=?,`school_address`=? WHERE id=?";
					} else {
						querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`standard`='" + data.standard + "',`board`=?,`school_name`=?,`school_address`=? WHERE id=?";
					}

					await db.query(querydata,[data.fname,data.lname,data.dob,data.gender.toLowerCase(),data.address,data.pincode,data.mobile,data.board,data.school_name,data.school_address,data.student_id])
						.then(async result => {
							if (result.affectedRows > 0) {
								await db.query("select students.*,boards.name as board_name,boards.short_code as board_code from `students` left join boards on boards.id = students.board where students.id = " + data.student_id)
									.then(async result => {
										response_msg = { status: 200, msg: "Student profile update successfully", data: result, "password_change": 0 }
									})

							} else {
								response_msg = { status: 410, msg: "Update profile fail" }
							}

							res.status(200).send(response_msg);
						})
				}else {
					bcrypt.hash(newpassword, 10, async (err, hash) => {
						if (data.standard == "" || data.standard == undefined || data.standard == null) {
							querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`board`=?,`school_name`=?,`school_address`=?,`password` ='"+hash+"' WHERE id=?";
						} else {
							querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`standard`='" + data.standard + "',`board`=?,`school_name`=?,`school_address`=?,`password` = '" + hash + "' WHERE id=?";
						}
						await db.query(querydata,[data.fname,data.lname,data.dob,data.gender.toLowerCase(),data.address,data.pincode,data.mobile,data.board,data.school_name,data.school_address,data.student_id])
							.then(async result => {
								if (result.affectedRows > 0) {
									await db.query("select students.*,boards.name as board_name,boards.short_code as board_code from `students` left join boards on boards.id = students.board where students.id = " + data.student_id)
										.then(result => {
											response_msg = { status: 200, msg: "Student profile update successfully", data: result, "password_change": 1 }
										})


								} else {
									response_msg = { status: 410, msg: "Update profile fail" }
								}

								res.status(200).send(response_msg);
							})
					})
				}
			}
			else {
				if (req.file) {
					fs.chmod(req.file.path, 0o777, async () => {
						console.log("Trying to write to file");
						let data = req.body;
						newpassword = req.body.password;

						let upload_path = req.file.destination + "/" + req.file.filename;
						upload_path = process.env.PORTALURL + upload_path.replace(process.env.IMAGEUPLOADBASEURL, "");
						if (newpassword == '' || newpassword == undefined || newpassword == null) {
							if (data.standard == "" || data.standard == undefined || data.standard == null) {
								querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`board`=?,`school_name`=?,`school_address`=?,profile_pic = '" + upload_path + "' WHERE id=?";
							} else {
								querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`standard`='" + data.standard + "',`board`=?,`school_name`=?,`school_address`=?,profile_pic = '" + upload_path + "' WHERE id=?";
							}
							await db.query(querydata,[data.fname,data.lname,data.dob,data.gender.toLowerCase(),data.address,data.pincode,data.mobile,data.board,data.school_name,data.school_address,data.student_id])
								.then(async result => {
									if (result.affectedRows > 0) {
										await db.query("select students.*,boards.name as board_name,boards.short_code as board_code from `students` left join boards on boards.id = students.board where students.id = " + data.student_id)
											.then(result => {
												response_msg = { status: 200, msg: "Student profile update successfully", data: result, password_change: 0 }
											})

									} else {
										response_msg = { status: 410, msg: "Update profile fail" }
									}



									res.status(200).send(response_msg);
								})
						}
						else {
							bcrypt.hash(newpassword, 10, async (err, hash) => {
								if (data.standard == "" || data.standard == undefined || data.standard == null) {
									querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`board`=?,`school_name`=?,`school_address`=?,`password` = '" + hash + "',profile_pic = '" + upload_path + "' WHERE id=?";
								} else {
									querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`standard`='" + data.standard + "',`board`=?,`school_name`=?,`school_address`=?,`password` = '" + hash + "',profile_pic = '" + upload_path + "' WHERE id=?";
								}
								await db.query(querydata,[data.fname,data.lname,data.dob,data.gender.toLowerCase(),data.address,data.pincode,data.mobile,data.board,data.school_name,data.school_address,data.student_id])
									.then(async result => {
										if (result.affectedRows > 0) {
											await db.query("select students.*,boards.name as board_name,boards.short_code as board_code from `students` left join boards on boards.id = students.board where students.id = " + data.student_id)
												.then(result => {
													response_msg = { status: 200, msg: "Student profile update successfully ", data: result, password_change: 1 }
												})

										} else {
											response_msg = { status: 410, msg: "Update profile fail" }
										}

										res.status(200).send(response_msg);
									})
							})
						}
					})
				}
				else {
					let data = req.body;
					newpassword = req.body.password;
					if (newpassword == '' || newpassword == undefined || newpassword == null) {
						if (data.standard == "" || data.standard == undefined || data.standard == null) {
							querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`board`=?,`school_name`=?,	`school_address`=? WHERE id=?";
						} else {
							querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`standard`='" + data.standard + "',`board`=?,`school_name`=?,`school_address`=? WHERE id=?";
						}
						await db.query(querydata,[data.fname,data.lname,data.dob,data.gender.toLowerCase(),data.address,data.pincode,data.mobile,data.board,data.school_name,data.school_address,data.student_id])
							.then(async result => {
								if (result.affectedRows > 0) {
									await db.query("select students.*,boards.name as board_name,boards.short_code as board_code from `students` left join boards on boards.id = students.board where students.id = " + data.student_id)
										.then(result => {
											response_msg = { status: 200, msg: "Student profile update successfully", data: result, password_change: 0 }
										})
										.then(async result => {
											await academic_sessions.update_academicessions_student_id(data.student_id)
										})
								} else {
									response_msg = { status: 410, msg: "Update profile fail" }
								}

								res.status(200).send(response_msg);
							})
					}
					else {
						bcrypt.hash(newpassword, 10, async (err, hash) => {
							if (data.standard == "" || data.standard == undefined || data.standard == null) {
								querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`board`=?,`school_name`=?,`school_address`=?,`password` = '" + hash + "' WHERE id=?";
							} else {							
								querydata = "UPDATE `students` SET `fname`=?,`lname`=?,`dob`=?,`gender`=?,`address`=?,`pincode`=?,`mobile`=?,`standard`='" + data.standard + "',`board`=?,`school_name`=?,`school_address`=?,`password` = '" + hash + "' WHERE id=?";
							}
							
							await db.query(querydata,[data.fname,data.lname,data.dob,data.gender.toLowerCase(),data.address,data.pincode,data.mobile,data.board,data.school_name,data.school_address,data.student_id])
								.then(async result => {
									if (result.affectedRows > 0) {
										await db.query("select students.*,boards.name as board_name,boards.short_code as board_code from `students` left join boards on boards.id = students.board where students.id = " + data.student_id)
											.then(result => {
												response_msg = { status: 200, msg: "Student profile update successfully", data: result, password_change: 1 }
											})


									} else {
										response_msg = { status: 410, msg: "Update profile fail" }
									}


									res.status(200).send(response_msg);
								})
						})
					}

				}
			}
		})


	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

router.post('/updatestudentprofilefosubscription', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let response = {};
		let data=req.body;		
		querydata = `UPDATE students SET pincode=?,school_name=?,school_address=? WHERE id=?`;
		await db.query(querydata,[data.pincode,data.school_name,data.school_address,data.student_id])
			.then(async result => {
				if (result.affectedRows > 0) {
					await db.query("select students.*,boards.name as board_name,boards.short_code as board_code from `students` left join boards on boards.id = students.board where students.id = " + data.student_id)
						.then(async result => {
							response = { status: 200, msg: "Student profile update successfully", data: result }
						})

				} else {
					response = { status: 410, msg: "Update profile fail" }
				}

				res.status(200).send(response);
			})



	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

// Send forget password link to email and mobile for update
router.post('/forgetpassword', async function (req, res, next) {

	try {
		let forgetpasswordlink = "";
		let useremail = "";
		let student_id = 0;
		useremail = req.body.email;
		let student_mobile = "";
		let student_name = "";
		await db.query("select * from `students` where `email` = '" + useremail + "' and is_deleted = 0")
			.then(async result => {
				if (result.length > 0) {
					var b = Buffer.from(useremail + "#" + Date.now())
					let encripteddata = (b).toString('base64');
					student_mobile = result[0].mobile;
					student_id = result[0].id;
					student_name = result[0].fname;
					forgetpasswordlink = process.env.PORTALURL + "page-reset-password/" + encripteddata;
					const shorturlPromise = new Promise((resolve, reject) => {
						let shortforgetpasswordlink = "";
						// Both versions
						const axios = require('axios');
						let data = JSON.stringify({
							"description": "Forget Password Link",
							"url": forgetpasswordlink,
							"domain": "tinyurl.com"
						});

						let config_short = {
							method: 'post',
							url: 'https://api.tinyurl.com/create',
							headers: {
								'Content-Type': 'application/json',
								'Authorization': process.env.URLSHORTING_TOKEN,
								"Accept": "application/json",
							},
							data: data
						};

						axios.request(config_short)
							.then((response) => {
								let short_response = (response.data);
								shortforgetpasswordlink = short_response.data.tiny_url;
								resolve(shortforgetpasswordlink);
							})
							.catch((error) => {
								console.log(error);
							});
					});
					shorturlPromise.then(result => {

						/////////////////SEND SMS //////////////
						let smsbody = config.forgetpasswordsms.body.replaceAll("#field1#", result);
						let smsdata = { phonenumber: student_mobile, body: encodeURI(smsbody) }
						helper.sendsms(smsdata);
						////////////////////////////////////////////

						let mailbody = config.forgetpassword.body.replace('#clickurl#', result);
						mailbody = mailbody.replace('#name#', student_name);
						let reqest_data = { email: useremail, subject: config.forgetpassword.subject, body: mailbody }
						helper.sendmail(reqest_data);
						db.query("delete from `forget_password_check` where `student_id` = " + student_id)

						res.send({ status: 200, requestdata: reqest_data, msg: "Forget password reset link send to your email and mobile." });
					})
				}
				else {
					res.send({ status: 410, msg: "Student details not found" });
				}
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		res.send({ status: 410, msg: "SMS pack expired" });
	}
});
// Set new password for student against id
router.post('/generatepassword', async function (req, res, next) {
	try {
		let message = req.body.message;
		let newpassword = req.body.password;
		var b = Buffer.from(message, 'base64')
		let encripteddata = (b).toString();
		bcrypt.hash(newpassword, 10, async (err, hash) => {
			if (err) {
				message = "Something went wrong, please try again later.";
			}
			else {
				encripteddata = encripteddata.split("#")
				let targettime = Number.parseFloat(encripteddata[1]) + 590000;
				let current_time = Date.now();
				let student_id = 0;
				let email = encripteddata[0];
				await db.query("select * from `students` where `email` = '" + email + "' and `status` = 1 and `is_deleted` = 0")
					.then(async student_result => {
						student_id = student_result[0].id;
						let search_result = await db.query("select * from forget_password_check where student_id = " + student_id);

						if (targettime > current_time && search_result.length == 0) {

							await db.query("update `students` set `password` = '" + hash + "' where `email` = '" + email + "'")
								.then(async result => {
									if (result.affectedRows > 0) {

										db.query("delete from `logindevices` where `userid` = " + student_id);
										db.query("INSERT INTO `forget_password_check`(`student_id`) VALUES (" + student_id + ")");

										res.send({ status: 200, msg: "Your login password changed successfully." });
									} else {
										res.send({ status: 410, msg: "Your Invalid email address." });
									}
								})
						} else {
							res.send({ status: 410, msg: "Your link expired. Generate a new update link for password." });
						}
					})

			}
		});
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get Event history list for student to show in the lms portal dashboard page
router.get('/geteventhistory', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let student_id = 0;
		if (req.user != null) {
			student_id = req.user.id;
		}
		let date_ob = new Date();
		// current date
		// adjust 0 before single digit date
		let date = ("0" + date_ob.getDate()).slice(-2);

		// current month
		let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

		// current year
		let year = date_ob.getFullYear();

		let start_date = year + "-" + month + "-" + date + " 00:00:00";
		let end_date = year + "-" + month + "-" + date + " 23:59:59";
		let already_liked = [];
		await db.query("select * from `todayhistory_likecount` where `student_id` =" + student_id + " and `created_at` >= '" + start_date + "' and `created_at` < '" + end_date + "'")
			.then(result => {
				if (result.length > 0) {
					result.forEach(Element => {
						already_liked.push(Element.event_id);
					})
				}
			})
		let eventhistory = [];
		await db.query("select * from `event_history` where `is_deleted` = 0 and `status`= 1 and `event_date` LIKE '%-" + month + "-" + date + "'")
			.then(result => {
				result.forEach(Element => {
					if (already_liked.includes(Element.id)) {
						Element.is_liked = 1;
					} else {
						Element.is_liked = 0;
					}
					eventhistory.push(Element);
				})

			})
		if (eventhistory.length > 0) {
			res.json({ status: 200, already_liked: already_liked, data: eventhistory, msg: "Current history event details", currentdate: date, currentmonth: date_ob.toLocaleString('default', { month: 'long' }), currentyear: year });
		} else {
			res.json({ status: 200, already_liked: already_liked, data: [{ title: "No Data", event_date: year + "-" + month + "-" + date }], msg: "Current history event details not found", currentdate: date, currentmonth: date_ob.toLocaleString('default', { month: 'long' }), currentyear: year });
		}
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Show progress status status of the student in the lms portal.
router.post('/workstatus', async function (req, res, next) {
	try {
		let user_id = req.body.user_id;
		let work_progress = 0;
		let completed = "";
		if (user_id == 0) {
			res.json({ status: 200, msg: "Work Progress status", work_progress: 0, completed: "0%" });
		} else {
			var now = new Date();
			let checkcreatedate = new Date(now.setFullYear(now.getFullYear() - 1));

			let date = ("0" + checkcreatedate.getDate()).slice(-2);

			// current month
			let month = ("0" + (checkcreatedate.getMonth() + 1)).slice(-2);

			// current year
			let year = checkcreatedate.getFullYear();

			await db.query("select * from `purchased_subscribtions` where `student_id` = " + user_id + " and created_at > '" + year + "-" + month + "-" + date + "' order by created_at desc")
				.then(result => {
					if (result.length > 0) {
						work_progress = 3;
						completed = (3 / 5) * 100 + "%";
					}
				})
			res.json({ status: 200, msg: "Work Progress status", work_progress: work_progress, completed: completed });
		}
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get all active subjects list in LMS portal
router.get('/getallsubject', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await subjects.getsubject());
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

router.post('/testsms', async function (req, res, next) {
	let reqest_data = { phone: req.phone, msg: req.msg, name: req.name }
	helper.sendmail(reqest_data);
})
// Get all active listed school list for registration form
router.post('/master/getschoollist', async function (req, res, next) {
	try {
		res.json(await school_master.getlist(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get all competitive subjects list in LMS portal
router.post('/getcompetitivesubject', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await subjects.getcompetitivesubject(req.body, req.user));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

/// Chit code apis
// Get student id from email
//https://lmsapi.schemaphic.co.in:4000/api/lms/master/get_student_details/saunak99@gmail.com
router.get('/master/get_student_details/:email', async function (req, res, next) {
	try {
		let student_id = 0;

		await db.query("select * from `students` where `email` = '" + req.params.email + "' and is_deleted = 0 and status = 1")
			.then(result => {
				result.forEach(Element => {
					student_id = Element.id;
				})
			})

		res.status(200).send({ msg: "Get student ID is : " + student_id });
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Delete student exam details by id
//https://lmsapi.schemaphic.co.in:4000/api/lms/master/delete_student_examdetails/481
router.get('/master/delete_student_examdetails/:id', async function (req, res, next) {
	try {
		await db.query("delete from `exam_completed` where `student_id` = " + req.params.id);
		await db.query("delete from `exam_completed_competitive` where `student_id` = " + req.params.id);
		await db.query("delete from `online_exam_question_answers` where `student_id` = " + req.params.id);
		await db.query("delete from `online_exam_question_answers_competitive` where `student_id` = " + req.params.id);
		await db.query("delete from `elibrary_access_log` where `student_id` = " + req.params.id);
		await db.query("delete from `elibrary_visit_log` where `student_id` = " + req.params.id);
		await db.query("delete from `searched_questions` where `student_id` = " + req.params.id);

		res.status(200).send({ msg: "Old exam details deleted against student ID : " + req.params.id });
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Delete student subscription details by id
//https://lmsapi.schemaphic.co.in:4000/api/lms/master/delete_student_subscription/481
router.get('/master/delete_student_subscription/:id', async function (req, res, next) {
	try {
		await db.query("delete from `purchased_subscribtions` where `student_id` = " + req.params.id);
		await db.query("delete from `purchased_subscribtions_details` where `student_id` = " + req.params.id);
		await db.query("delete from `exam_completed` where `student_id` = " + req.params.id);
		await db.query("delete from `exam_completed_competitive` where `student_id` = " + req.params.id);
		await db.query("delete from `online_exam_question_answers` where `student_id` = " + req.params.id);
		await db.query("delete from `online_exam_question_answers_competitive` where `student_id` = " + req.params.id);
		await db.query("delete from `elibrary_access_log` where `student_id` = " + req.params.id);
		await db.query("delete from `addtocart_subscription` where `student_id` = " + req.params.id);
		await db.query("delete from `interm_storeexamdata` where `student_id` = " + req.params.id);
		await db.query("delete from `exam_chapter_interm_store` where `student_id` = " + req.params.id);

		res.status(200).send({ msg: "Old exam details deleted against student ID : " + req.params.id });
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Delete student record by id
//https://lmsapi.schemaphic.co.in:4000/api/lms/master/delete_student_record/481
router.get('/master/delete_student_record/:id', async function (req, res, next) {
	try {
		await db.query("delete from `students` where `id` = " + req.params.id);
		await db.query("delete from `purchased_subscribtions` where `student_id` = " + req.params.id);
		await db.query("delete from `purchased_subscribtions_details` where `student_id` = " + req.params.id);
		await db.query("delete from `exam_completed` where `student_id` = " + req.params.id);
		await db.query("delete from `exam_completed_competitive` where `student_id` = " + req.params.id);
		await db.query("delete from `online_exam_question_answers` where `student_id` = " + req.params.id);
		await db.query("delete from `online_exam_question_answers_competitive` where `student_id` = " + req.params.id);
		await db.query("delete from `elibrary_access_log` where `student_id` = " + req.params.id);
		await db.query("delete from `addtocart_subscription` where `student_id` = " + req.params.id);
		await db.query("delete from `interm_storeexamdata` where `student_id` = " + req.params.id);
		await db.query("delete from `exam_chapter_interm_store` where `student_id` = " + req.params.id);

		res.status(200).send({ msg: "Old exam details deleted against student ID : " + req.params.id });
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Delete student library details by id
//https://lmsapi.schemaphic.co.in:4000/api/lms/master/delete_library_details/481
router.get('/master/delete_library_details/:id', async function (req, res, next) {
	try {
		await db.query("delete from `elibrary_access_log` where `student_id` = " + req.params.id);
		await db.query("delete from `elibrary_visit_log` where `student_id` = " + req.params.id);
		await db.query("delete from `searched_questions` where `student_id` = " + req.params.id);

		res.status(200).send({ msg: "Old library details deleted against student ID : " + req.params.id });
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get all terms and condition details. This is for LMS portal registration page
router.get('/terms_condition', async function (req, res, next) {
	try {
		resultdata = {};
		await db.query("select * from `setting_page`")
			.then(result => {
				resultdata = { status: 200, msg: "Terms and Condition", data: result[0].terms_condition }
			})
		res.status(200).send(resultdata);
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Privacy policy details to show in LMS portal.
router.get('/privacy_policy', async function (req, res, next) {
	try {
		resultdata = {};
		await db.query("select * from `setting_page`")
			.then(result => {
				resultdata = { status: 200, msg: "Privacy Policy", data: result[0].privacy_policy }
			})
		res.status(200).send(resultdata);
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Store feedback after exam completion.
router.post('/store_feedback', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		resultdata = {};
		await db.query("INSERT INTO `feedback_rating`(`feedback_details`, `student_id`,`exam_unique_id`)\
		 VALUES ('"+ JSON.stringify(req.body.feedback) + "'," + req.user.id + ",'" + req.body.exam_unique_id + "')")
			.then(result => {
				resultdata = { status: 200, msg: "Feedback post successfully" }
			})
		res.status(200).send(resultdata);
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get feedback questions list
router.post('/get_feedback', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		resultdata = {};
		await db.query("select * from `feedback_question` where status = 1")
			.then(result => {
				resultdata = { status: 200, msg: "Feedback post successfully", data: result }
			})
		res.status(200).send(resultdata);
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Check feedback status. Feedback given or not
router.post('/get_feedback_status', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		resultdata = {};
		await db.query("select * from `feedback_rating` where `student_id` = " + req.body.student_id)
			.then(result => {
				resultdata = { status: 200, msg: "Feedback details", feedback_status: result.length }
			})
		res.status(200).send(resultdata);
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

router.post('/sendmobileno_verification', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		resultdata = {};
		await db.query("select * from `feedback_question`")
			.then(result => {
				resultdata = { status: 200, msg: "Feedback post successfully", data: result }
			})
		res.status(200).send(resultdata);
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

//Chit code
// Delete student exam details by id
//https://lmsapi.schemaphic.co.in:4000/api/lms/master/deleteexamdata/481
router.get('/deleteexamdata/:id', async function (req, res, next) {
	try {
		db.query("delete from `interm_storeexamdata` where `student_id` = " + req.params.id)
			.then(result => {
				res.status(200).send({ msg: "Deleted" });
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Store like against a event message by students. Accept event id and student id as parameter.
router.post('/storelikerecord', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let student_id = req.user.id;
		db.query("INSERT INTO `todayhistory_likecount`(`student_id`,`event_id`) VALUES (" + student_id + "," + req.body.event_id + ")")
			.then(result => {
				res.status(200).send({ status: 200, msg: "Thanks for your like.", is_liked: 1 });
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// To unlock screen screen by password
router.post('/unlockscreen', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let student_id = req.user.id;
		let response = "";
		await db.query("SELECT students.* from students where id = " + student_id)
			.then(result => {
				bcrypt.compare(req.body.password, result[0].password, (bErr, bResult) => {
					// wrong password
					if (bResult == false) {
						message = 'Invalid password.';
						response = { status: 410, lock: 0, msg: message }
						res.status(200).send(response);
					}
					if (bResult == true) {
						message = 'Unlocked successfully';
						response = { status: 200, lock: 1, msg: message }
						res.status(200).send(response);
					}
				});

			})

	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

router.get('/test', async function (req, res, next) {
	shortUrl.short('https://www.npmjs.com/package/node-url-shortener', function (err, url) {
		console.log(url);
	});
});
//Chit code
// Get e-library timespend against student id
//https://lmsapi.schemaphic.co.in:4000/api/lms/master/deleteexamdata/481
router.get('/master/get_elibrary_timespend/:id', async function (req, res, next) {
	try {
		let student_id = 0;
		let resultdata = [];
		await db.query("select * from `elibrary_access_log` where `student_id` = " + req.params.id)
			.then(result => {
				result.forEach(Element => {
					resultdata.push(Element);
				})
			})

		res.status(200).send({ resultdata });
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Store newsletter application request against student ID.
router.post('/sendnewsletterapplication', async function (req, res, next) {
	try {
		let useremail = req.body.email;
		await db.query("select * from `newsletter_application` where `user_email` = '" + useremail + "'")
			.then(async search_result => {
				if (search_result.length == 0) {
					await db.query("INSERT INTO `newsletter_application`(`user_email`) VALUES('" + useremail + "')")
						.then(result => {
							let mailbody = config.newslettermail.body;
							let reqest_data = { email: useremail, subject: config.newslettermail.subject, body: mailbody }
							helper.sendmail(reqest_data);
							res.send({ status: 200, msg: "Your application for newsletter mail received successfully." });
						})
				} else {
					res.send({ status: 200, msg: "Your application for newsletter mail already sent." });
				}
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Store otp verification status against student ID during registration.Verified or not
router.post('/store_otp_verifcation_status', async function (req, res, next) {
	try {
		resultdata = {};
		await db.query("select * from `otp_verification_status` where `email` = '" + req.body.email + "' and mobile_no = '" + req.body.mobile + "' and standard = '" + req.body.standard + "' and board = '" + req.body.board + "'")
			.then(async result => {
				if (result.length == 0) {
					await db.query("INSERT INTO `otp_verification_status`(`student_name`,`mobile_no`, `email`, `standard`, `board`,`mobile_otp`, `email_otp`, `otp_timeout`,`academic_year`) VALUES ('" + req.body.student_name + "','" + req.body.mobile + "','" + req.body.email + "','" + req.body.standard + "','" + req.body.board + "','" + req.body.mobile_otp_status + "','" + req.body.email_otp_status + "','" + req.body.otp_timeout + "','" + req.body.academic_year + "')");
				} else {
					await db.query("update `otp_verification_status` set `mobile_otp` = '" + req.body.email_otp_status + "', `email_otp` = '" + req.body.mobile_otp_status + "',`academic_year` = '" + req.body.academic_year + "',`otp_timeout` = '" + req.body.otp_timeout + "',`otp_checked` = 1 where `email` = '" + req.body.email + "'");
				}
			})

			.then(result => {
				resultdata = { status: 200, msg: "OTP status post successfully", data: result }
			})
		res.status(200).send(resultdata);
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

////////////// GET ALL CATEGORY LIST ///////////////////
router.get('/getallexamcategories', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let userdata = req.user;
		res.json(await exam_category.getallexamcategories(userdata));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Set OTP to mobile no before login screen
router.get('/sendpreloginotp', async function (req, res, next) {
	try {
		const email = "jaydeep.m@new.com";
		const mobile = 6289581169;
		const otp = (Math.floor(100000 + Math.random() * 900000));

		if (mobile != '') {
			let smsbody = config.registerotp.body.replace("#field1#", otp);
			smsbody = smsbody.replace("#field2#", '+916289581169');// For new MOBILE NO

			let smsdata = { phonenumber: mobile, body: encodeURI(smsbody) }
			helper.sendsms(smsdata);

		}

		if (email != '') {

			let mailbody = config.preloginotp.body.replace("#OTP#", otp);
			let maildata = { email: email, subject: config.preloginotp.subject, body: mailbody }
			helper.sendmail(maildata);
		}

		/////////////////////////////////////////////////////////////////////
		let otp_encrypt = CryptoJS.AES.encrypt(otp.toString(), process.env.CRYPTO).toString();

		resultdata = { "status": 200, "otp": otp_encrypt }
		res.status(200).send(resultdata);
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

////////////////////////////////// PUBLIC TODAY IN HISTORY API without token///////////////////////////
// This API call for guest users
router.get('/geteventhistory_public', async function (req, res, next) {
	try {
		let student_id = 0;
		if (req.user != null) {
			student_id = req.user.id;
		}
		let date_ob = new Date();
		// current date
		// adjust 0 before single digit date
		let date = ("0" + date_ob.getDate()).slice(-2);

		// current month
		let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

		// current year
		let year = date_ob.getFullYear();

		let start_date = year + "-" + month + "-01 00:00:00";
		let end_date = year + "-" + month + "-" + date + " 23:59:59";
		let already_liked = [];
		await db.query("select * from `todayhistory_likecount` where `student_id` =" + student_id + " and `created_at` >= '" + start_date + "' and `created_at` < '" + end_date + "'")
			.then(result => {
				if (result.length > 0) {
					result.forEach(Element => {
						already_liked.push(Element.event_id);
					})
				}
			})
		let eventhistory = [];
		await db.query("select * from `event_history` where `is_deleted` = 0 and `status`= 1 and `event_date` >= '" + start_date + "' and `event_date` < '" + end_date + "'")
			.then(result => {
				result.forEach(Element => {
					if (already_liked.includes(Element.id)) {
						Element.is_liked = 1;
					} else {
						Element.is_liked = 0;
					}
					eventhistory.push(Element);
				})

			})
		if (eventhistory.length > 0) {
			res.json({ status: 200, already_liked: already_liked, data: eventhistory, msg: "Current history event details", currentdate: date, currentmonth: date_ob.toLocaleString('default', { month: 'long' }), currentyear: year });
		} else {
			res.json({ status: 200, already_liked: already_liked, data: [{ title: "No Data", event_date: year + "-" + month + "-" + date }], msg: "Current history event details not found", currentdate: date, currentmonth: date_ob.toLocaleString('default', { month: 'long' }), currentyear: year });
		}
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

//Get students dashboard details with token. Show all the dashboard graphs	
router.post('/dashboard_performancescore', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		if (req.user == undefined) {
			res.json({ status: 200, msg: "Not logged in" });
		} else {
			res.json(await admin.ovalallperformance_calculation(req.user.id));
		}
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
//Get students dashboard details with token. Show all the dashboard graphs	
router.post('/dashboard_logindata', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		if (req.user == undefined) {
			res.json({ status: 300, msg: "Not logged in" });
		} else {
			res.json(await admin.getdashboard_data(req.user));
		}
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Check password link exist or not. 
// Check forget password link exist or not against email address 
router.post('/checkpasswordlinkexist', async function (req, res, next) {
	try {
		let message = req.body.message;
		var b = Buffer.from(message, 'base64')
		let encripteddata = (b).toString();

		encripteddata = encripteddata.split("#")
		let targettime = Number.parseFloat(encripteddata[1]) + 590000;
		let current_time = Date.now();
		await db.query("select * from `students` where `email` = '" + encripteddata[0] + "'")
			.then(async result => {
				if (result.length > 0) {
					let student_id = result[0].id;
					await db.query("select * from `forget_password_check` where `student_id` = " + student_id)
						.then(result_inner => {
							if ((targettime > current_time) && (result_inner.length == 0)) {
								res.send({ status: 200, msg: "Link still active" });
							} else {
								res.send({ status: 410, msg: "Your link expired. Generate a new update link for password." });
							}
						})
				}
			})

	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get exam categories list for library section as per student subscription
router.get('/getexamcategories_library', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let userdata = req.user;
		res.json(await exam_category.getexamcategories_library(userdata));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get exam types list for library section as per student subscription
router.post('/getexamtype_library', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let userdata = req.user;
		res.json(await exam_type.getexamtype_library(req.body, userdata));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

//Store interm Student registration details for MIS report
router.post('/interm_registration', async function (req, res, next) {
	try {
		let data = req.body;
		let registration_from = 1;
		if (data.device_token != '' && data.device_token != undefined) {
			registration_from = 2;
		} else {
			data.device_token = "";
		}
		bcrypt.hash(data.password, 10, async (err, hash) => {
			await db.query(`INSERT INTO interm_students(fname, lname, dob, email,password, gender, address, pincode, mobile, 
              standard, board,school_name, school_address,device_token,registration_from) 
            VALUES ('`+ data.fname + `','` + data.lname + `','` + data.dob + `','` + data.email + `', '` + hash + `', '` + data.gender.toLowerCase() + `','` + data.address + `',
            '`+ data.pincode + `','` + data.mobile + `','` + data.standard + `','` + data.board.substring(0, 1) + `','` + data.school_name.replace(/['‘’"“”]/g, '') + `','` + data.school_address.replace(/['‘’"“”]/g, '') + `'
            ,'`+ data.device_token + `','` + registration_from + `')`).then((result) => {
				if (result) {
					res.status(200).send({ status: 200, msg: "Intermediate student data stored." });
				}
			})
		})

	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
//Chit code
// Delete Mock exam data against a particular student ID
//https://lmsapi.schemaphic.co.in:4000/api/lms/master/deletemockexamdata/481
router.get('/deletemockexamdata/:id', async function (req, res, next) {
	try {
		await db.query("delete from `interm_storeexamdata` where `exam_type` = 3 and `student_id` = " + req.params.id)
		await db.query("delete from `exam_completed` where `exam_type` = 3 and `student_id` = " + req.params.id)
		await db.query("delete from `online_exam_question_answers` where `exam_unique_id` LIKE '3_%' and `student_id` = " + req.params.id)
			.then(result => {
				res.status(200).send({ msg: "Mock Deleted" });
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
//Chit code
// Delete module exam data against a particular student ID
//https://lmsapi.schemaphic.co.in:4000/api/lms/master/deletemoduleexamdata/481
router.get('/deletemoduleexamdata/:id', async function (req, res, next) {
	try {
		await db.query("delete from `interm_storeexamdata` where `exam_type` = 2 and `student_id` = " + req.params.id)
		await db.query("delete from `exam_completed` where `exam_type` = 2 and `student_id` = " + req.params.id)
		await db.query("delete from `online_exam_question_answers` where `exam_unique_id` LIKE '2_%' and `student_id` = " + req.params.id)
			.then(result => {
				res.status(200).send({ msg: "Module Deleted" });
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

// Update students profile image only against student ID
router.post('/updatestudentprofileimage', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let newpassword = "";
		let response_msg = "";
		let querydata = "";

		upload(req, res, async function (err) {
			if (err) {
				response_msg = { status: 410, msg: "Update profile fail", error: err }
			}
			else {
				if (req.file) {
					fs.chmod(req.file.path, 0o777, async () => {
						console.log("Trying to write to file");
						let data = req.body;

						let upload_path = req.file.destination + "/" + req.file.filename;
						upload_path = process.env.PORTALURL + upload_path.replace(process.env.IMAGEUPLOADBASEURL, "");


						querydata = "UPDATE `students` SET profile_pic = '" + upload_path + "' WHERE id=" + data.student_id;
						await db.query(querydata)
							.then(async result => {
								if (result.affectedRows > 0) {
									response_msg = { status: 200, msg: "Student profile picture updated successfully", filepath: upload_path }
								} else {
									response_msg = { status: 410, msg: "Update profile fail" }
								}
								res.status(200).send(response_msg);
							})


					})
				}

			}
		})


	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});


///////////////////////ADD DEMO USER //////////////////////////
//http://localhost:4000/apiv2/lms/add_demo_user/test2@g.com/WB/10 //email Address/board short code/Class
router.get('/add_demo_user/:email/:board/:class', async function (req, res, next) {
	let response = {};
	let status = 410;
	let message = 'Something went wrong, please try again later.';

	await db.query("select * from `students` where `email` = '" + req.params.email + "'")
		.then(async result => {
			if (result.length > 0) {
				response = { status: 410, msg: "User already exist." }
				res.status(200).send(response);
			} else {
				bcrypt.hash("123456", 10, async (err, hash) => {
					if (err) {
						message = "Something went wrong, please try again later.";
					}
					else {
						let registration_from = 1;

						const ipAddress = "0.0.0.0";
						let board_id = 0;
						await db.query("select * from `boards` where is_deleted = 0 and status = 1 and `short_code` ='" + req.params.board.toUpperCase() + "'")
							.then(async result => {
								if (result.length > 0) {
									board_id = result[0].id;
									await db.query(
										`INSERT INTO students (fname, lname, dob, email,password, gender, address, pincode, mobile, 
				standard, board,school_name, school_address,mobile_otp_verify,email_otp_verify,ip_address,device_token,registration_from) 
			  VALUES ('Test','User','12-12-1988','` + req.params.email + `', '` + hash + `', 'male','Kolkata',
			  '700001','9876543210','` + req.params.class + `','` + board_id + `','Test','Kolkata'
			  ,'1','1','`+ ipAddress + `','','` + registration_from + `')`)
										.then(async result => {
											if (result.affectedRows > 0) {

												status = 200;
												message = 'Student registered successfully done';

												response = { status: status, msg: message }
												res.status(200).send(response)
											}
											else {
												status = 410;
												message = 'Something went wrong, please try again later.';
												response = { status: status, msg: message }
												res.status(200).send(response)
											}
										})
								}
								else {
									status = 410;
									message = 'Something went wrong, please try again later.Board data not exist.';
									response = { status: status, msg: message }
									res.status(200).send(response)
								}
							});
					}
				});
			}
		})
});


/////////////////////////////// ADVERTISMENTS SECTION //////////////////////////////

// Get advertisements list for mobile app only.
router.get('/getadvtisements', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let advt_details = [];
		let total_page = static_data.screen_list.length;
		for (let i = 0; i < total_page; i++) {
			advt_details[i] = "";
		}
		await db.query("select * from `advertisements` where status = 1 and is_deleted = 0 order by screen_name ASC")
			.then(result => {
				result.forEach(element => {
					if (element.image_upload) {
						advt_details[element.screen_name - 1] = process.env.IMAGEBASEURL + element.image_upload;
					}
				})
				res.status(200).send({ status: 200, msg: "Advertisements List", data: advt_details });
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

/////////////////////////////// FEEDBACK SECTION //////////////////////////////
// Submit feedback to admin from mobile APP
router.post('/submitfeedback', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let student_id = req.user.id;
		let content = req.body.content;
		await db.query(`INSERT INTO student_feedback(feedback_content,stdudent_id) VALUES ('` + content + `','` + student_id + `')`)
			.then(async result => {
				if (result.affectedRows > 0) {
					await db.query("select * from `students` where id = " + student_id)
						.then(result_inner => {
							let mailbody = config.feedback_message.body;
							mailbody = mailbody.replace('#name#', result_inner[0].fname+" "+result_inner[0].lname);
							mailbody = mailbody.replace('#email#', result_inner[0].email);
							mailbody = mailbody.replace('#phone#', result_inner[0].mobile);
							mailbody = mailbody.replace('#msg#', content);
							let reqest_data = { email: process.env.TESTUSER, subject: config.feedback_message.subject, body: mailbody }
							helper.sendmail(reqest_data);
						})
					message = 'Student feedback sent successfully';
					response = { status: 200, msg: message }
					res.status(200).send(response)
				}
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

/////////////////////////////// Store Local Storage DATA //////////////////////////////
router.post('/storelocalstorage', async function (req, res, next) {
	try {
		let api_name = req.body.api_name;
		let local_storage_data = JSON.stringify(req.body.local_storage_data);
		await db.query(`INSERT INTO store_localstorage(api_name, local_storage_data) VALUES ('` + api_name + `','` + local_storage_data + `')`)
			.then(async result => {
				if (result.affectedRows > 0) {
					message = 'Local storage data saved successfully';
					response = { status: 200, msg: message }
					res.status(200).send(response)
				}
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

///////////////////////////////////////////////////////////////////////////////////
// Get academic sessions list against board
router.post('/getacademicsessions_list', async function (req, res, next) {
	try {
		let data = req.body;
		res.json(await academic_sessions.get_academicsessionsby_board(data));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get academic sessions list against board for current year. Active or not expired academic year data only
router.post('/getacademicsessions_list_current_year', async function (req, res, next) {
	try {
		let data = req.body;

		res.json(await academic_sessions.get_academicsessionsby_board(data));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

///////////////////////////// Update Profile ////////////////////////
// Update Student Class from profile section against student ID 
router.post('/update_student_class', adminMiddleware.validateToken, async function (req, res, next) {
	let data = req.body;
	data.id = req.user.id;
	data.board = req.user.board;
	data.name = req.user.name;
	//await admin.send_verification_otp(data);
	res.json(await students.update_student_class(data));
})

// Send verification OTP to email and mobile to update class of a student 
router.post('/send_verification_otp_update_class', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		const student_details = req.user.id;
		let data = {}
		await students.get_student_details_by_id(student_details)
			.then(async result => {
				if (result.data.id > 0) {
					data = { "email": result.data.email, "mobile": result.data.mobile, "student_name": req.user.fname };
					res.json(await admin.send_verification_otp_update_class(data));
				}
			})
		//res.json(await admin.send_verification_otp_update_class(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});


// Get Student Details by ID 
router.post('/getstudentdetails_byid', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let student_details = req.user.id;
		let current_date = moment(new Date()).format('YYYY-MM-DD 23:59:59');
		let data = {}
		var d = new Date(current_date);
		current_date = d.getTime();
		await students.get_student_details_by_id(student_details)
			.then(async result => {
				if (result.data.id > 0) {
					let session_available = await exam_scholastic.get_last_date_month(result.data.academy_end_date)
					var d = new Date(session_available);
					let course_end_date = d.getTime();

					if (course_end_date < current_date) {
						result.data.expired = 1;
					} else {
						result.data.expired = 0;
					}
					let academic_year_ary = result.data.academic_year.split("-");

					const mS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
					result.data.academic_year = mS[parseInt(academic_year_ary[1] - 1)] + " " + academic_year_ary[0] + " - " + mS[parseInt(academic_year_ary[3] - 1)] + " " + academic_year_ary[2];
					result.data.class_id = result.data.standard;

					res.status(200).send({ status: 200, msg: "Student Details", data: result.data });
				}
			})
		//res.json(await admin.send_verification_otp_update_class(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get all class list which available for student to select from dropdown in profile section
router.get('/master/getclasseslist_after_login', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await classes.getclasses_after_login(req.user));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Archived class list for a student
router.get('/master/getclasseslist_archive', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await classes.getclasses_archive(req.user));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
//Get archived exam categories for a student whcih available or active
router.post('/getexamcategories_archive', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let userdata = req.user;
		userdata.class = req.body.class;
		res.json(await exam_category.getexamcategories_archive(userdata));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
//Get archived exam categories for a student whcih available or active
router.post('/getallexamcategories_archive', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let userdata = req.user;
		userdata.class = req.body.class;
		res.json(await exam_category.getallexamcategories_archive(userdata));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

//router.post('/getexamtype',adminMiddleware.validateToken ,async function(req,res,next){
// Get archived exam type for a student whcih available or active
router.post('/getexamtype_archive', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let userdata = req.user;
		userdata.class = req.body.class;
		res.json(await exam_type.getexamtype_archive(req.body, userdata));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get archived categories for a student whcih available or active 
router.post('/getexamtype_library_archive', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let userdata = req.user;
		userdata.class = req.body.class;
		res.json(await exam_type.getexamtype_library_archive(req.body, userdata));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get archived categories for a student whcih available or active against Library
router.post('/getexamcategories_library_archive', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let userdata = req.user;
		userdata.class = req.body.class;
		res.json(await exam_category.getexamcategories_library_archive(userdata));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

// Send verification OTP to email and mobile from website registration
router.post('/send_verification_otp_website', async function (req, res, next) {
	try {
		res.json(await admin.send_verification_otp_website(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
module.exports = router;