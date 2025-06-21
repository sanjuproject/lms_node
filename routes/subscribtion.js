const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const exam_scholastic = require('../services/exam_scholastic_subscribtion_master.js');
const exam_competitive = require('../services/exam_competitive_subscribtion_master.js');
const addtocart_subscription = require('../services/addtocart_subscription.js');
const purchased_subscribtions = require('../services/purchased_subscribtions.js');
const e_library_subscription_master = require('../services/e_library_subscription_master.js');
const purchase_subscribtion_details = require('../services/purchase_subscribtion_details.js');
const exam_integrated_subscribtion_master = require('../services/exam_integrated_subscribtion_master.js');
const helper = require('../helper.js');
const { config } = require('dotenv');
const configdata = require('../config.js');
const db = require('../services/db.js');
const fs = require('fs');
var http = require('http');
var request = require('request');
var moment = require('moment');
const jsPDF = require('jspdf');
//var html_to_pdf = require('html-pdf-node');
var PDFDocument = require('pdfkit');
var shortUrl = require("node-url-shortener");
const datevalue = require('date-and-time');
const academic_session = require('../services/academic_sessions.js');
const axios = require('axios');
const student = require('../services/students.js');

// Get scholastic exam details card against board and class
router.post('/getexamscholasticdetails', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let purchased_packages = await purchased_subscribtions.get_purchased_subscription_details(req.body);
		req.body.id = req.user.id;
		let checkProfile = await student.checkprofil(req.body);
		let result = await exam_scholastic.getscholasticsubscribtion_details(req.body, purchased_packages['scholatic'],
			purchased_packages['scholatic_purcase'], purchased_packages['elibrary_purchase']);
		res.json({ ...result, checkProfile });
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});


// Get competitive exam details card against board and class
router.post('/getexamcompetitivedetails', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let purchased_packages = await purchased_subscribtions.get_purchased_subscription_details(req.body);
		req.body.id = req.user.id;
		let result = await exam_competitive.getcompetitivesubscribtion_details(req.body, purchased_packages['competive'],
			purchased_packages['competive_purchase'], purchased_packages['elibrary_purchase_com'])
		let checkProfile = await student.checkprofil(req.body);
		res.json({ ...result, checkProfile });
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Add to cart subscribtion/products for purchase
router.post('/addtocart', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await addtocart_subscription.addtocart(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
})
// This API call after payment gateway retutrn success. Please don't remove it or change it.
router.post('/getcartstlist', async function (req, res, next) { // CALL FROM PAYMENT PHP CODE. THATS WHY TOKEN VALIDATION MISSING
	try {
		let cart_result = 0;
		await db.query("select * from addtocart_subscription where student_id = " + req.body.student_id)
			.then(result => {
				if (result.length > 0) {
					cart_result = 1;
				}
			})
		if (cart_result == undefined) {
			res.json({ status: 200, msg: "Cart not found" });
		} else {
			await db.query("select * from `students` where `id` = " + req.body.student_id)
				.then(result => {
					if (result.length > 0) {
						req.body.board_id = result[0].board;
					} else {
						req.body.board_id = 0;
					}
				})
			res.json(await addtocart_subscription.getcartstlist(req.body));
		}
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
})
// This API call after payment gateway retutrn success. Please don't remove it or change it.
router.post('/purchased_subscription', async function (req, res, next) { // CALL FROM PAYMENT PHP CODE. THATS WHY TOKEN VALIDATION MISSING
	try {
		let purchased_packages = "";
		let purchased_packages2 = "";
		let purchased_details = [];
		let student_id = req.body.student_id;
		let amount_paid = 0;
		let updated_subscribtion_details = [];
		let cart_amount = 0;
		let datatypeary = [];
		req.body.subscription_details.forEach(async element => {
			if (element.exam_category_id == 2)// Competititve
			{
				datatypeary.push(element.exam_type_id);
			}
		})
		let current_date = moment().format("YYYY-MM-DD") + " 23:59:59";


		await db.query("select academic_session.course_end_date,students.standard from `students` left join academic_session on academic_session.id = students.academic_year where students.id = " + student_id)
			.then(async result => {

				if (current_date > result[0].course_end_date) {
					await db.query("delete from purchased_subscribtions where `student_id` = " + student_id)
					await db.query("delete from purchased_subscribtions_details where `student_id` = " + student_id)
					await db.query("delete from elibrary_visit_log_archive where `student_id` = " + student_id + " and previous_class =" + result[0].standard + "")
					await db.query("delete from exam_completed_archive where `student_id` = " + student_id + " and previous_class =" + result[0].standard + "")
					await db.query("delete from exam_completed_competitive_archive where `student_id` = " + student_id + " and previous_class =" + result[0].standard + "")
					await db.query("delete from searched_questions_archive where `student_id` = " + student_id + " and previous_class =" + result[0].standard + "")
				}
			})
			.then(async sub_exam_data => {
				purchase_subscribtion_details.delete_record_byid(datatypeary, 2)
					.then(async response => {

						let insert_query = "INSERT INTO `purchased_subscribtions_details`(`student_id`, `subscribtion_payment_trans_id`, \
		`exam_category_id`, `class`, `exam_type_id`, `subscription_id`, `no_set`, `no_module`, `no_mock`, `no_casestudy`,\
		 `cart_amount`, `category`, `category_short_code`, `type_name`, `board_name`, `subject_name`,`subject_id`,`has_library`,`only_elibrary`) \
		 VALUES";
						req.body.subscription_details.forEach(async element => {
							if (element.exam_category_id == 2) {
								element.subject_id = 0;
								element.subject_name = element.type_name;
							}
							insert_query += "(" + element.student_id + ",'" + req.body.subscribtion_payment_trans_id + "','" + element.exam_category_id + "','" + element.class + "','" + element.exam_type_id + "',\
			 '"+ element.subscription_id + "','" + element.no_set + "','" + element.no_module + "','" + element.no_mock + "','" + element.no_casestudy + "',\
			 '"+ element.cart_amount + "','" + element.category + "','" + element.category_short_code + "','" + element.type_name + "','" + element.board_name + "','" + element.subject_name + "','" + element.subject_id + "',\
			 '"+ element.has_library + "','" + element.only_elibrary + "'),";

							let e_library = "NA";
							let case_study = "NA";
							if (element.has_library > 0) {
								e_library = "Yes";
							}
							if (element.no_casestudy > 0) {
								case_study = "Yes";
							}
							if (element.category_short_code === 'COM') {
								purchased_packages += element.category + " : " + element.type_name + " Chapter Test :" + element.no_set + " E-library:" + e_library + " <br/>";
							} else {

								let module_no = 0;
								let mock_no = 0;

								if (element.no_module > 0) {
									module_no = 3;
								}
								if (element.no_mock > 0) {
									mock_no = 2;
								}

								//purchased_packages2 += element.category+" : "+element.subject_name+" Chapter Test :"+element.no_set+" Module No:"+module_no+" Mock No:"+mock_no+" E-library:"+e_library+" Case Study:"+case_study+" <br/>";
								purchased_packages2 += element.category + " : " + element.subject_name + " Chapter Test :" + element.no_set + " Module No:" + module_no + " Mock No:" + mock_no + " E-library:" + e_library + "<br/>";
							}
							amount_paid += parseInt(element.cart_amount);
						});
						insert_query += "";
						insert_query = insert_query.slice(0, -1)
						if (response.status == 200 && amount_paid == req.body.amount_paid) {
console.log("insert_querydsd sdsd ss");

							let response = await db.query(insert_query);
							if (response.affectedRows > 0) {
								updated_subscribtion_details = await db.query("select * from `purchased_subscribtions_details` where `student_id` = " + student_id + " order by id desc");

								updated_subscribtion_details[0]['amount_paid'] = amount_paid;
								//updated_subscribtion_details[0]['cart_amount'] = req.body.amount_paid;

								await purchased_subscribtions.delete_allsubscribtion_bystudentid(student_id)
									.then(async response => {
										if (response.status == 200) {
											let current_date = moment().format("YYYY-MM-DD") + " 23:59:59";

											await db.query("select academic_session.course_end_date,students.standard from `students` left join academic_session on academic_session.id = students.academic_year where students.id = " + student_id)
												.then(async result => {

													if (current_date > result[0].course_end_date) {
														await student.call_cronjob_archive_exam(student_id, result[0].standard)
													}
												})


											await purchased_subscribtions.student_purchased_subscription((updated_subscribtion_details))
												.then(async result => {


													await db.query("select * from `students` where id =" + student_id)
														.then(student_data => {

															let mailbody = configdata.studentpayment_successful.body.replace('#coursedata#', purchased_packages + " " + purchased_packages2);
															mailbody = mailbody.replace("#name#", student_data[0].fname);
															let reqest_data2 = { email: result.email, subject: configdata.studentpayment_successful.subject, body: mailbody, attachment_exist: 1 }
															downloadgenerateinvoicepdf(student_id, req.body.subscribtion_payment_trans_id);
															helper.sendmail(reqest_data2);
														})

													//addtocart_subscription.delete_allcart(student_id);
													res.json(result);
												})
										}
									})

							}
						}
					})
			})

	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
})
// Delete products added to cart individually
router.post('/delete_addtocart', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await addtocart_subscription.delete_addtocart(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
})
// Delete all added carts from list my a student
router.post('/delete_allcart', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		res.json(await addtocart_subscription.delete_allcart(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
})
// Get Purchased Subscription Details against a student
router.post('/get_purchased_subscription_details', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let response = await purchased_subscribtions.get_purchased_subscription_details(req.body);

		res.status(200).send({ status: 200, data: response, msg: "Student Subscription details" });
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
})
// Get Subscription Dashboard Details against a paridicular student
router.post('/get_subscription_dashboard_details', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let student_id = req.user.id; // Student ID from 
		let total_competitive_master = await db.query("select * from `exam_competitive_subscribtion_master` where `status` = 1 and `is_deleted`=0");
		let total_scholastic_master = await db.query("select * from `exam_scholastic_subscribtion_master` where `status` = 1 and `is_deleted`=0");

		let total_competitive_completed = await db.query("select * from `exam_completed_competitive` where `student_id` = " + student_id);
		let total_scholastic_completed = await db.query("select * from `exam_completed` where `student_id` = " + student_id);

		db.query("select * from `purchased_subscribtions` where `student_id` = " + student_id + " and is_active = 1")
			.then((result, err) => {
				let scholatic_details = [];
				let competive_details = [];
				let counter1 = 0;
				let counter2 = 0;
				result.forEach(element => {
					let subscription_details = [];
					subscription_details = JSON.parse(element.subscription_details);


					subscription_details.forEach(element_inner => {

						if (element_inner.category == 'COMPETITIVE') {

							competive_details[counter1] = element_inner.subscription_id;
							counter1++;
						}
						if (element_inner.category == 'SCHOLASTIC') {

							scholatic_details[counter2] = element_inner.subscription_id;
							counter2++;
						}
					})
				})

				res.status(200).send({
					status: 200, msg: "Student Subscription status", total_scholastic_master: total_scholastic_master.length,
					total_competitive_master: total_competitive_master.length, scholatic_details_count: scholatic_details.length, competive_details_count: competive_details.length,
					total_scholastic_completed: total_scholastic_completed.length, total_competitive_completed: total_competitive_completed.length
				});
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// E-Library Subscription List for competetive 
router.post('/e_library_subscription_list_competetive', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		req.body.id = req.user.id;
		let checkProfile = await student.checkprofil(req.body);
		let purchased_packages = await purchased_subscribtions.get_purchased_subscription_details(req.body);
		let result=await e_library_subscription_master.list_competetive(req.body, purchased_packages['elibrary_com'],
			purchased_packages['elibrary_purchase_com'])
		res.json({...result,checkProfile});
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// E-Library Subscription List for scholastic 
router.post('/e_library_subscription_list_scolastic', adminMiddleware.validateToken, async function (req, res, next) {
	let checkProfile={};
	try {
		req.body.id = req.user.id;
		let purchased_packages = await purchased_subscribtions.get_purchased_subscription_details(req.body);
		//console.log(purchased_packages)

		checkProfile = await student.checkprofil(req.body);		
		const result = await e_library_subscription_master.list_scolastic(req.body, purchased_packages);
		res.json({...result, checkProfile});
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// E-Library Subscription List for scholastic
router.post('/e_library_purchased_subject_list', async function (req, res, next) {
	try {
		res.json(await purchased_subscribtions.list_scolastic_subjects(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// E-Library Subscription List for competetive for a particular student
router.post('/e_library_purchased_subject_list_competitive', adminMiddleware.validateToken, async function (req, res, next) {
	try {		
		const result = await purchased_subscribtions.list_competitive_library(req.body);
		res.json(result);
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get Setting Details. contain current session,GST rate
router.post('/get_setting_data', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let data = []
		data.board_id = req.user.board;
		data.id = req.user.id;
		let academic_session_ary = await academic_session.get_academicsessionsby_board(data);

		if (academic_session_ary.status != 400 && academic_session_ary.list.length > 0) {
			let current_session = academic_session_ary.list[0].academicyear;
			let setting_data = await db.query("select * from `setting_page` where 1");

			delete setting_data[0].updated_at;
			setting_data[0].current_session = current_session;
			res.status(200).send({ status: 200, msg: "Setting Details", data: setting_data[0] });
		} else {
			res.status(200).send({ status: 200, msg: "Setting Details", data: [] });
		}

	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});
// Get scholastic subscription combination price
router.post('/getscholasticsubscribtion_combination_price', async function (req, res, next) {
	try {
		res.json(await exam_scholastic.get_combination_price(req.body));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

router.post('/paymentcall', async function (req, res, next) {

	var options = {
		'method': 'POST',
		'url': process.env.PORTALURL + 'payment_gateway/payment_api.php',
		'headers': {
		},
		formData: req.body
	};
	request(options, function (error, response) {
		if (error) throw new Error(error);

		res.send(response.body);

	});

})
// Get Subscription Details against a student. Student ID from TOKEN
router.post('/getsubscriptiondetails', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let response = {};
		let student_id = req.user.id; // Student ID from TOKEN
		await db.query("select * from `student_subscription_details` where `student_id` = " + student_id)
			.then(result => {
				response = {
					status: 200, "msg": "Congratulations! Your subscription purchase has been processed successfully.", email: result[0].email, exam_unique_id: result[0].exam_unique_id, is_subscribe: result[0].is_subscribe,
					is_subscribe_e_library: result[0].is_subscribe_e_library
				};
			})
		res.status(200).send(response)
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

// Get Payment Transaction Details against a student. Student ID from TOKEN
router.post('/getpayment_translist', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let response = {};
		let transaction = [];
		let student_id = req.user.id; // Student ID from TOKEN

		await db.query("select payment_trasns_details.id,payment_trasns_details.payment_trans_id,payment_trasns_details.amount as `paid_amount`,payment_trasns_details.created_at,payment_trasns_details.student_id,payment_trasns_details.order_id,payment_trasns_details.payment_mode from `purchased_subscribtions_details` left join payment_trasns_details on purchased_subscribtions_details.subscribtion_payment_trans_id = payment_trasns_details.payment_trans_id where `purchased_subscribtions_details`.`student_id` = " + student_id + " group by purchased_subscribtions_details.subscribtion_payment_trans_id order by purchased_subscribtions_details.created_at desc")
			.then(result => {
				result.forEach(element => {
					transaction.push(element);
				})
			})

		//////////////////////////// ARCHIVE DATA //////////////////////////////////////////
		await db.query("select payment_trasns_details.id,payment_trasns_details.payment_trans_id,payment_trasns_details.amount as `paid_amount`,payment_trasns_details.created_at,payment_trasns_details.student_id,payment_trasns_details.order_id,payment_trasns_details.payment_mode from `purchased_subscribtions_details_archive` left join payment_trasns_details on purchased_subscribtions_details_archive.subscribtion_payment_trans_id = payment_trasns_details.payment_trans_id where `purchased_subscribtions_details_archive`.`student_id` = " + student_id + " group by purchased_subscribtions_details_archive.subscribtion_payment_trans_id order by purchased_subscribtions_details_archive.created_at desc")
			.then(result => {
				result.forEach(element => {
					transaction.push(element);
				})
			})

		response = { status: 200, "msg": "Payment transaction details", transaction_details: transaction };
		res.status(200).send(response)
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

// Generate Invoice PDF against a particular payment transaction record
router.post('/generateinvoicepdf', adminMiddleware.validateToken, async function (req, res, next) {
	let student_id = req.user.id; // Student ID from TOKEN
	let transaction_id = req.body.payment_trans_id;
	let subscription_details = "";
	let invoice_details = "";
	let payment_details = "";
	let created_at = "";
	let total_amount_without_gst = 0;
	let total_amount = 0;
	let student_detials = "";
	let cgstamount = 0;
	let sgstamount = 0;
	let gst_rate = parseInt(process.env.GST_RATE);
	let cgst_rate = gst_rate / 2;
	let sgst_rate = gst_rate / 2;
	let record_exist = 0
	await db.query("select students.*,boards.name as board_name from `students` left join boards on boards.id = students.board where students.id= " + student_id)
		.then(result => {
			student_detials = result[0];
		})

	let check_record_exist_sql = "select purchased_subscribtions_details.* from `purchased_subscribtions_details` where `purchased_subscribtions_details`.`student_id` = " + student_id + " and purchased_subscribtions_details.subscribtion_payment_trans_id = " + transaction_id;
	await db.query(check_record_exist_sql)
		.then(result => {
			if (result.length > 0) {
				record_exist = 1;
			}
		})
	let data_query = "select purchased_subscribtions_details_archive.*,purchased_subscribtions_details_archive.subscribtion_payment_trans_id as payment_trans_id,purchased_subscribtions_details_archive.cart_amount as paid_amount,payment_trasns_details.order_id,payment_trasns_details.payment_mode,payment_trasns_details.bank_ref_no from `purchased_subscribtions_details_archive` left join `payment_trasns_details` on `payment_trasns_details`.`payment_trans_id` = `purchased_subscribtions_details_archive`.`subscribtion_payment_trans_id` where `purchased_subscribtions_details_archive`.`student_id` = " + student_id + " and purchased_subscribtions_details_archive.subscribtion_payment_trans_id = " + transaction_id;

	if (record_exist > 0) {
		data_query = "select purchased_subscribtions_details.*,purchased_subscribtions_details.subscribtion_payment_trans_id as payment_trans_id,purchased_subscribtions_details.cart_amount as paid_amount,payment_trasns_details.order_id,payment_trasns_details.payment_mode,payment_trasns_details.bank_ref_no from `purchased_subscribtions_details` left join `payment_trasns_details` on `payment_trasns_details`.`payment_trans_id` = `purchased_subscribtions_details`.`subscribtion_payment_trans_id` where `purchased_subscribtions_details`.`student_id` = " + student_id + " and purchased_subscribtions_details.subscribtion_payment_trans_id = " + transaction_id;
	}
	await db.query(data_query)
		.then(result => {

			//subscription_details = JSON.parse(result[0].subscription_details);
			//created_at = result[0].created_at;
			var date = result[0].created_at;
			if (process.env.HOSTNAME == 'lmsapi.clvdev.in') {
				////////////////////// fOR STAGING CALL THIS CODE ///////////////////
				var isoDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
				////////////////////// fOR STAGING CALL THIS CODE ///////////////////
			} else {
				//////////// FOR LIVE CALL THIS CODE ///////////////////////////////
				var isoDateTime = new Date(date.getTime() + 19800000).toISOString();
				//////////// FOR LIVE CALL THIS CODE ///////////////////////////////
			}
			created_at = isoDateTime.slice(0, -1);
			let i = 1;

			result.forEach(element => {
				let module_exist = "No";
				let mock_exist = "No";
				let e_library = "No";
				let case_study = "No";
				let set_no = 0;
				let cart_data = "";
				let paid_amount = element.paid_amount;
				if (element.no_set[1] > 0) {
					set_no = element.no_set.slice(1, -1);
					cart_data = "Chapter Test : " + set_no + "<br/>";
				}
				if (element.no_module > 0) {
					module_exist = 3;
					cart_data += " Module : " + module_exist + "<br/>";
				}
				if (element.no_mock > 0) {
					mock_exist = 2;
					cart_data += " Mock : " + mock_exist + "<br/>";
				}
				if (element.has_library > 0 || element.only_elibrary > 0) {
					e_library = "Yes";
					cart_data += " e-Library : " + e_library + "<br/>";
				}
				if (element.no_casestudy > 0) {
					case_study = "Yes";
					//cart_data += " Case Study : "+case_study+"<br/>";
				}

				total_amount += parseFloat(paid_amount);
				let gst_cal_amount = (paid_amount * (100)) / (100 + gst_rate);
				total_amount_without_gst += parseFloat((paid_amount * (100)) / (100 + gst_rate));
				cgstamount += parseFloat((gst_cal_amount * cgst_rate) / 100);
				sgstamount += parseFloat((gst_cal_amount * sgst_rate) / 100);

				let subject = "";
				if (element.exam_category_id == 1) {
					subject = element.subject_name;
				} else {
					subject = element.type_name;
				}

				invoice_details += `<tr>
                            <td style="text-align: center;padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                `+ i + `</td>
                            <td
                                style="padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                1</td>
                            <td
                                style="text-align: left;padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                `+ student_detials.board_name + "     " + student_detials.standard + "  " + element.category + " : " + subject + "<br/>" + cart_data + `</td>
                            <td
                                style="text-align: center;padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                1</td>
                            <td
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                Rs. `+ parseFloat((paid_amount * (100)) / (100 + gst_rate)).toFixed(2) + `</td>
                        </tr>`;
				i++;
			})
			payment_details = `<p style="color: #000000;font-size: 6px;margin:0px;"><strong>Order ID:</strong>
						`+ result[0].order_id + `
						</p>
						<p style="color: #000000;font-size: 6px;margin:0px;"><strong>Payment Mode:</strong>
						`+ result[0].payment_mode + `
						</p>
						<p style="color: #000000;font-size: 6px;margin:0px;"><strong>Bank Ref No:</strong>
						`+ result[0].bank_ref_no + `
						</p>
						`;
		})

	let file_1 = {
		content: `<!DOCTYPE html>
<head>
<title>new Learning Ventures Invoice</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@400;500;600;700&display=swap"
    rel="stylesheet">
</head>

<body>
<div style="width: 450px;margin: 10px auto;">
    <div
        style="border-top: 2px solid #ddd;padding: 5px 20px;border-bottom: 0.5px solid #ddd;font-size: 8px;font-weight: bold;color:#000000;">
        Invoice No : `+ transaction_id + `</div>
    <div style="padding: 10px 10px 0px 10px;">

        <table style="width:100%">
            <tr>
                <td style="vertical-align: top;text-align:left;">
                    <p style="font-weight: bold;font-size:8px;color:#000000;margin:0px;">new Learning
                        Ventures</p>
                    <p style="color: #000000;font-size:6px;line-height:8px;margin:0px;"> 1/23, Vivek Nagar Jheel Road,<br />Kolkata 700075<br />West Bengal<br />info@new.com
                    </p><br />
                </td>
                <td style="vertical-align: top;text-align:left;float:right;">
                    <p style="font-size:8px;font-weight: bold;color:#000000;margin:0px;">Invoice To</p>
                    <p style="font-weight:bold;font-size: 6px;margin:0px;line-height:8px;">`+ student_detials.fname + " " + student_detials.lname + `</p>
                    <p style=" color: #000000;font-size: 6px;margin:0px;line-height:8px;">`+ student_detials.address + " " + student_detials.pincode + `</p>
					
					<p style="color: #000000;font-size: 6px;margin:0px;line-height:8px;">`+ student_detials.email + `</p>
                    <p style="color: #000000;font-size: 6px;margin:0px;line-height:8px;">`+ student_detials.mobile + `</p>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <p style="color: #000000;font-size: 6px;margin:-10px 0px 0px 0px;">GST No -
					19AAQFC3749N1ZM</p>
                    <p style="color: #000000;font-size: 6px;margin:0px;"><strong>Invoice
                            Date</strong> :`+ moment(created_at).format('D  MMM YYYY') + `</p>
					<p style="color: #000000;font-size: 6px;margin:0px;"><strong>Time</strong>
                            : `+ moment(created_at).format('hh') + `  : ` + moment(created_at).format('mm') + ` ` + moment(created_at).format('A') + `</p>				
                           `+ payment_details + ` 
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <table cellspacing="0" cellpadding="0"
                        style="width: 100%;border-top: 1px solid #ddd;border-left: 1px solid #ddd;font-size: 6px;margin-top: 10px;">
                        <tr>
                            <th
                                style="text-align: center;padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                S.NO</th>
                            <th
                                style="text-align: center;padding: 10px;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                ITEM</th>
                            <th
                                style="width: 60%;text-align: left;border-bottom: 1px solid #ddd;border-right: 1px solid #ddd;padding-left: 10px;">
                                ITEM LISTS</th>
                            <th
                                style="text-align: center;padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                QUANTITY</th>
                            <th
                                style="padding: 10px 5px 10px 10px !important;text-align: center;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                PRICE</th>
                        </tr>
                        `+ invoice_details + `
                        <tr>
                            <td colspan="4"
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                            SUBTOTAL</td>
                            <td
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                Rs. `+ parseFloat(total_amount_without_gst).toFixed(2) + `</td>
                        </tr>
                        <tr>
                            <td colspan="4"
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                CGST (9%)</td>
                            <td
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                Rs. `+ parseFloat(cgstamount).toFixed(2) + `</td>
                        </tr>
                        <tr>
                            <td colspan="4"
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                SGST (9%)</td>
                            <td
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                               Rs.  `+ parseFloat(sgstamount).toFixed(2) + `</td>
                        </tr>
                        <tr>
                            <td colspan="4"
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                TOTAL</td>
                            <td
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                Rs. `+ parseFloat(total_amount).toFixed(2) + `</td>
                        </tr>
                    </table>
                    <p style="color: #bbbbbb;font-size: 6px;text-align: center;margin-top: 15px;word-spacing: 0px;">Please consider
                        the<span style="color:#45b572"> environment</span>
                        before printing this invoice</p>
                </td>
            </tr>
        </table>
    </div>
</div>
</body>

</html>`
	}
	await downloadgenerateinvoicepdf(student_id, transaction_id)
		.then(result => {
			if (result == 1) {
				res.status(200).send({ status: 200, msg: "Invoice PDF generated.", pdffile: file_1, pdf_file_path: process.env.PORTALURL + "payment_gateway/invoice.pdf" })
			} else {
				res.status(200).send({ status: 200, msg: "Invoice PDF generated.", pdffile: file_1, pdf_file_path: "" })
			}
		})

	//res.status(200).send({status:200,msg:"Invoice PDF generated.",pdffile:file_1})


});

// Get subscribed product list against a student 
router.post('/getsubscribed_list', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		//console.log(req.user);
		let purchased_packages = [];
		let userdata = [];
		userdata['student_id'] = req.user.id;
		userdata['class_id'] = req.user.class;
		userdata['board_id'] = req.user.board;
		///////////SCHOLASTIC LIST /////////////////
		await db.query("select purchased_subscribtions_details.*,subjects.subject_image,subjects.subject_color_code from `purchased_subscribtions_details` left join subjects on subjects.id = purchased_subscribtions_details.subject_id \
		where `purchased_subscribtions_details`.`exam_category_id` = 1 and `purchased_subscribtions_details`.`student_id` = "+ req.user.id + " \
		and `purchased_subscribtions_details`.`class` = "+ req.user.class + " and `purchased_subscribtions_details`.`exam_type_id` = " + req.user.board)
			.then(result => {
				if (result.length > 0) {
					result.forEach(element => {
						let module_count = 0;
						let mock_count = 0;
						let case_study = "No";
						let elibrary = "No";
						if (element.no_module == 1) {
							module_count = 3;
						}
						if (element.no_mock == 1) {
							mock_count = 2;
						}
						if (element.no_casestudy == 1) {
							case_study = "Yes";
						}
						if (element.has_library == 1 || element.only_elibrary) {
							elibrary = "Yes";
						}
						purchased_packages.push({
							category_id: 1, category: element.category, subject_name: element.subject_name, subject_image: element.subject_image,
							subject_color_code: element.subject_color_code, no_set: element.no_set, mock_count: mock_count, module_count: module_count,
							case_study: case_study, elibrary: elibrary
						})
					})
				}
			})

		///////////COMPETITIVE LIST /////////////////
		await db.query("select purchased_subscribtions_details.*,subjects.subject_image,subjects.subject_color_code from `purchased_subscribtions_details` left join subjects on subjects.id = purchased_subscribtions_details.subject_id \
		where `purchased_subscribtions_details`.`exam_category_id` = 2 and `purchased_subscribtions_details`.`student_id` = "+ req.user.id)
			.then(result => {
				if (result.length > 0) {
					result.forEach(element => {
						let module_count = "NA";
						let mock_count = "NA";
						let case_study = "NA";
						let elibrary = "No";
						if (element.no_module == 1) {
							module_count = 3;
						}
						if (element.no_mock == 1) {
							mock_count = 2;
						}
						if (element.no_casestudy == 1) {
							case_study = "Yes";
						}
						if (element.has_library == 1 || element.only_elibrary) {
							elibrary = "Yes";
						}
						purchased_packages.push({
							category_id: 2, category: element.category, subject_name: "Competitive", subject_image: element.subject_image,
							subject_color_code: element.subject_color_code, no_set: element.no_set, mock_count: mock_count, module_count: module_count,
							case_study: case_study, elibrary: elibrary
						})
					})
				}
			})
		res.status(200).send({ status: 200, msg: "Subscribed list.", data: purchased_packages })
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});


// Download invoice pdf against a particular payment transaction
async function downloadgenerateinvoicepdf(student_id, payment_trans_id) {
	let transaction_id = payment_trans_id;
	let gst_rate = parseInt(process.env.GST_RATE);
	let subscription_details = "";
	let invoice_details = "";
	let payment_details = "";
	let created_at = "";
	let total_amount_without_gst = 0;
	let total_amount = 0;
	let student_detials = "";
	let cgstamount = 0;
	let sgstamount = 0;
	let order_id = "";
	let bank_ref_no = "";
	let payment_mode = "";
	let record_exist = 0;
	await db.query("select students.*,boards.name as board_name from `students` left join boards on boards.id = students.board where students.id= " + student_id)
		.then(result => {
			student_detials = result[0];
		})
	let check_record_exist_sql = "select purchased_subscribtions_details.* from purchased_subscribtions_details where `purchased_subscribtions_details`.`student_id` = " + student_id + " and purchased_subscribtions_details.subscribtion_payment_trans_id = " + transaction_id;
	await db.query(check_record_exist_sql)
		.then(result => {
			if (result.length > 0) {
				record_exist = 1;
			}
		})

	let data_query = "select purchased_subscribtions_details_archive.*,purchased_subscribtions_details_archive.subscribtion_payment_trans_id as payment_trans_id,purchased_subscribtions_details_archive.cart_amount as paid_amount,payment_trasns_details.order_id,payment_trasns_details.payment_mode,payment_trasns_details.bank_ref_no from `purchased_subscribtions_details_archive` left join `payment_trasns_details` on `payment_trasns_details`.`payment_trans_id` = `purchased_subscribtions_details_archive`.`subscribtion_payment_trans_id` where `purchased_subscribtions_details_archive`.`student_id` = " + student_id + " and purchased_subscribtions_details_archive.subscribtion_payment_trans_id = " + transaction_id;

	if (record_exist > 0) {
		data_query = "select purchased_subscribtions_details.*,purchased_subscribtions_details.subscribtion_payment_trans_id as payment_trans_id,purchased_subscribtions_details.cart_amount as paid_amount,payment_trasns_details.order_id,payment_trasns_details.payment_mode,payment_trasns_details.bank_ref_no from `purchased_subscribtions_details` left join `payment_trasns_details` on `payment_trasns_details`.`payment_trans_id` = `purchased_subscribtions_details`.`subscribtion_payment_trans_id` where `purchased_subscribtions_details`.`student_id` = " + student_id + " and purchased_subscribtions_details.subscribtion_payment_trans_id = " + transaction_id;
	}
	await db.query(data_query)
		.then(result => {

			//subscription_details = JSON.parse(result[0].subscription_details);
			//created_at = result[0].created_at;
			var date = new Date();
			if (result) {
				date = result[0].created_at;
			}
			if (process.env.HOSTNAME == 'lmsapi.clvdev.in') {
				////////////////////// fOR STAGING CALL THIS CODE ///////////////////
				var isoDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
				////////////////////// fOR STAGING CALL THIS CODE ///////////////////
			} else {
				//////////// FOR LIVE CALL THIS CODE ///////////////////////////////
				var isoDateTime = new Date(date.getTime() + 19800000).toISOString();
				//////////// FOR LIVE CALL THIS CODE ///////////////////////////////
			}
			created_at = isoDateTime.slice(0, -1);
			let i = 1;

			result.forEach(element => {
				let module_exist = "No";
				let mock_exist = "No";
				let e_library = "No";
				let case_study = "No";
				let cart_data = "";
				let paid_amount = element.paid_amount;
				if (element.no_set[1] > 0) {
					set_no = element.no_set.slice(1, -1);
					cart_data = " Chapter Test : " + set_no + "<br/>";
				}
				if (element.no_module > 0) {
					module_exist = 3;
					cart_data += " Module : " + module_exist + "<br/>";
				}
				if (element.no_mock > 0) {
					mock_exist = 2;
					cart_data += " Mock : " + mock_exist + "<br/>";
				}
				if (element.has_library > 0 || element.only_elibrary > 0) {
					e_library = "Yes";
					cart_data += " e-Library : " + e_library + "<br/>";
				}
				if (element.no_casestudy > 0) {
					case_study = "Yes";
					//cart_data += " Case Study : "+case_study+"<br/>";
				}
				total_amount += Math.round(element.cart_amount);
				let gst_cal_amount = (element.cart_amount * 100) / (100 + gst_rate);
				total_amount_without_gst += ((element.cart_amount * 100) / (100 + gst_rate));
				let gst_rate_part = gst_rate / 2;
				cgstamount += ((gst_cal_amount * gst_rate_part) / 100);
				sgstamount += ((gst_cal_amount * gst_rate_part) / 100);
				let subject = "";
				if (element.exam_category_id == 1) {
					subject = element.subject_name;
				} else {
					subject = element.type_name;
				}

				invoice_details += `<tr>
                            <td style="text-align: center;padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                `+ i + `</td>
                            <td
                                style="padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                1</td>
                            <td
                                style="text-align: left;padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">`+ student_detials.board_name + " " + student_detials.standard + " " + element.category + " " + subject + "<br/>" +
					cart_data + `</td>
								
								<td
                                style="text-align: center;padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                1</td>
                            <td
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                Rs. `+ parseFloat((element.cart_amount * 100) / (100 + gst_rate)).toFixed(2) + `</td>
                        </tr>`;
				i++;

				payment_details = `<p style="color: #000000;font-size: 7px;margin:0px;">
						<strong>Order ID:</strong>
						`+ element.order_id + `
						<br/>
						<strong>Payment Mode:</strong>
						`+ element.payment_mode + `
						<br/>
						<strong>Bank Ref No:</strong>
						`+ element.bank_ref_no + `
						</p>
						`;
			})
		})
	let download_file = "invoice_" + transaction_id + ".pdf";

	let file_1 = {
		"content": `<!DOCTYPE html>
<head>
<title>new Learning Ventures Invoice</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@400;500;600;700&display=swap"
    rel="stylesheet">
</head>

<body>
<div style="width: 100%;margin: 20px auto;">
    <div
        style="border-top: 2px solid #ddd;padding: 5px 20px;border-bottom: 0.5px solid #ddd;font-size: 8px;font-weight: bold;color:#3a3a3a;">
        Invoice No : `+ transaction_id + `</div>
    <div style="padding: 10px 10px 0px 10px;">

        <table style="width:100%">
            <tr>
                <td style="vertical-align: top;text-align:left;">
                    <p style="font-weight: bold;font-size:8px;color:#3a3a3a;margin:0px;">new Learning
                        Ventures</p>
                    <p style="color: #000;font-size:7px;line-height:8px;margin:0px;">1/23, Vivek Nagar Jheel Road, <br />Kolkata 700075<br />West Bengal<br />info@new.com
                    </p>
					<p style="color: #000;font-size: 7px;margin:0px;">GST No - 19AAQFC3749N1ZM<br/>
					<br/>
                    <strong>Invoice<br/>
                    Date</strong> :`+ moment(created_at).format('D  MMM YYYY') + `<br/>
					<strong>Time</strong>: `+ moment(created_at).format('hh') + `  : ` + moment(created_at).format('mm') + ` ` + moment(created_at).format('A') + `
					</p>
					`+ payment_details + `
					<br/>
                </td>
                <td style="vertical-align: top;text-align:right;float:right;">
                    <p style="font-size:8px;font-weight: bold;color:#3a3a3a;margin:0px;">Invoice To</p>
                    <p style="font-size: 7px;margin:0px;line-height:8px;">`+ student_detials.fname + " " + student_detials.lname + `<br/>
                    `+ student_detials.address + " " + student_detials.pincode + `<br/>
                    `+ student_detials.email + `<br/>
					`+ student_detials.mobile + `</p>
                </td>
            </tr>
            
            <tr>
                <td colspan="2">
						<table cellspacing="0" cellpadding="4"
							style="width: 90%;border-top: 1px solid #ddd;border-left: 1px solid #ddd;font-size: 7px;margin-top: 10px;">
							<tr>
								<th
									style="width:6%;text-align: center;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
									S.NO</th>
								<th
									style="width:6%;text-align: center;padding: 10px;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
									ITEM</th>
								<th
									style="width: 70%;text-align: left;border-bottom: 1px solid #ddd;border-right: 1px solid #ddd;padding-left: 10px;">
									ITEM LISTS</th>
								<th
									style="width:12%;text-align: center;padding: 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
									QUANTITY</th>
								<th
									style="padding: 10px 5px 10px 10px !important;text-align: center;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
									PRICE</th>
							</tr>
                        `+ invoice_details + `
                        <tr>
                            <td colspan="4"
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                            SUBTOTAL</td>
                            <td
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                Rs. `+ parseFloat(total_amount_without_gst).toFixed(2) + `</td>
                        </tr>
                        <tr>
                            <td colspan="4"
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                CGST (9%)</td>
                            <td
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                Rs. `+ parseFloat(cgstamount).toFixed(2) + `</td>
                        </tr>
                        <tr>
                            <td colspan="4"
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                SGST (9%)</td>
                            <td
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                               Rs.  `+ parseFloat(sgstamount).toFixed(2) + `</td>
                        </tr>
                        <tr>
                            <td colspan="4"
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                TOTAL</td>
                            <td
                                style="text-align: right;padding: 10px 5px 10px 10px;color: #555555;border-right: 1px solid #ddd;border-bottom: 1px solid #ddd;">
                                Rs. `+ parseFloat(total_amount).toFixed(2) + `</td>
                        </tr>
                    </table>
                    <p style="color: #bbbbbb;font-size: 6px;text-align: center;margin-top: 15px;word-spacing: 0px;">Please consider
                        the<span style="color:#45b572"> environment</span>
                        before printing this invoice</p>
                </td>
            </tr>
        </table>
    </div>
</div>
</body>

</html>`
	};

	const axios = require('axios');
	const FormData = require('form-data');
	let data = new FormData();
	data.append('invoice_body', JSON.stringify(file_1));

	let config = {
		method: 'post',
		maxBodyLength: Infinity,
		url: process.env.INVOICEPAGEPATH,
		headers: {
			...data.getHeaders()
		},
		data: data
	};

	axios.request(config)
		.then((response) => {
			console.log(JSON.stringify(response.data));
		})
		.catch((error) => {
			console.log(error);
		});
	return 1;
	// res.status(200).send({status:200,msg:"Invoice PDF generated."})
}

// Get students last payment details against a student ID
router.post('/getlastpaymentdetails', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		let student_id = req.user.id; // Student ID from 
		await db.query("select * from `payment_trasns_details` where `student_id` = " + student_id + " order by id desc limit 1")
			.then(result => {
				if (result.length > 0) {
					res.status(200).send({ status: 200, data: result[0], msg: "Last Payment details against student" });
				}
			})
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
})

///////////////////////////////// INTEGRATED ///////////////////////////////
router.post('/getintegratedsubscription', adminMiddleware.validateToken, async function (req, res, next) {
	try {
		req.body.exam_category_id = 3;
		let purchased_packages = await purchase_subscribtion_details.get_details_by_studentid(req.body);
		res.json(await exam_integrated_subscribtion_master.getintegratedsubscription(req.body, purchased_packages));
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});


module.exports = router;