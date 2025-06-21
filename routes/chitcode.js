const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const cron = require('node-cron');
const moment = require('moment');
const db = require('../services/db');
const helper = require('../helper');
const configdata = require('../config');
const fs = require('fs');
const students = require('../services/students.js');
//Update Student Phone No
//https://lmsapi.clvdev.in/api/chitcode/master/update_student_phoneno/1234567890/9876543210
router.get('/master/update_student_phoneno/:source_no/:target_no', async function (req, res, next) {
    try {
        await db.query("update students set mobile = ? where mobile = ?",
            [req.params.target_no,req.params.source_no]
        )
        .then(result=>{
            if(result.affectedRows > 0)
            {
                res.status(200).send({ msg: "Student Phone No updated with this phone no : " + req.params.target_no });
            }else{
                res.status(400).send({ msg: "Given phone no not exist"});
            }
        })
    }
    catch (err) {
        console.error(`Error while getting programming languages `, err.message);
        next(err);
    }
});

//Set Academic Session End Date
//http://localhost:4000/api/chitcode/master/update_academic_session/SCHOLASTIC/ICSE/2023-10-10/2025-12-31
router.get('/master/update_academic_session/:category_name/:board_type_name/:academic_session_start/:academic_session_end', async function (req, res, next) {
    try {
        
        db.query(
            "SELECT id FROM exam_categories WHERE category = ? AND is_deleted = 0 AND status = 1",
            [req.params.category_name]
        ).then(categoryResult => {
            if (categoryResult.length === 0) {
                return Promise.reject({ status: 404, message: "Category not found" });
            }
    
            const category_id = categoryResult[0].id;
            let boardQuery;
    
            // Determine the query for board type based on category_id
            if (category_id === 1) {
                boardQuery = db.query(
                    "SELECT id FROM boards WHERE name = ? AND is_deleted = 0 AND status = 1",
                    [req.params.board_type_name]
                );
            } else if (category_id === 2) {
                boardQuery = db.query(
                    "SELECT id FROM exam_type WHERE type_name = ? AND is_deleted = 0 AND status = 1",
                    [req.params.board_type_name]
                );
            } else {
                return Promise.reject({ status: 400, message: "Invalid category ID" });
            }
    
            return boardQuery.then(boardResult => {
                if (boardResult.length === 0) {
                    return Promise.reject({ status: 404, message: "Board type not found" });
                }
    
                const board_type_id = boardResult[0].id;
    
                // Construct academic year details
                let academic_session_start_ary = req.params.academic_session_start.split("-");
                let academic_session_end_ary = req.params.academic_session_end.split("-");
                
                let academic_year = `${academic_session_start_ary[0]}-${academic_session_start_ary[1]}-${academic_session_end_ary[0]}-${academic_session_end_ary[1]}`;
                let academy_start_date = `${academic_session_start_ary[0]}-${academic_session_start_ary[1]}`;
                let academy_end_date = `${academic_session_end_ary[0]}-${academic_session_end_ary[1]}`;
    
                // Update academic session
                return db.query(
                    `UPDATE academic_session 
                     SET academic_year = ?, 
                         academy_start_date = ?, 
                         academy_end_date = ?, 
                         course_start_date = ?, 
                         course_end_date = ? 
                     WHERE is_deleted = 0 
                       AND status = 1 
                       AND is_expired = 1 
                       AND exam_category_id = ? 
                       AND exam_board_type = ?`,
                    [
                        academic_year,
                        academy_start_date,
                        academy_end_date,
                        req.params.academic_session_start,
                        req.params.academic_session_end,
                        category_id,
                        board_type_id
                    ]
                );
            });
        })
        .then(() => {
            res.status(200).json({ message: "Academic session updated successfully" });
        })
        .catch(error => {
            console.error("Error updating academic session:", error);
            res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
        });
        // await db.query("update students set mobile = '"+req.params.target_no+"' where mobile = '"+req.params.source_no+"'")
        // .then(result=>{
        //     if(result.affectedRows > 0)
        //     {
        //         res.status(200).send({ msg: "Student Phone No updated with this phone no : " + req.params.target_no });
        //     }else{
        //         res.status(400).send({ msg: "Given phone no not exist"});
        //     }
        // })
    }
    catch (err) {
        console.error(`Error while getting programming languages `, err.message);
        next(err);
    }
});

//Update Student Class No
//https://lmsapi.clvdev.in/api/chitcode/master/update_student_phoneno/1234567890/9876543210
router.get('/master/update_student_phoneno/:source_no/:target_no', async function (req, res, next) {
    try {
        await db.query("update students set mobile = ? where mobile = ?",
            [req.params.target_no,req.params.source_no]
        )
        .then(result=>{
            if(result.affectedRows > 0)
            {
                res.status(200).send({ msg: "Student Phone No updated with this phone no : " + req.params.target_no });
            }else{
                res.status(400).send({ msg: "Given phone no not exist"});
            }
        })
    }
    catch (err) {
        console.error(`Error while getting programming languages `, err.message);
        next(err);
    }
});

//Assign Request Revert Back for DAM portal
//https://lmsapi.clvdev.in/api/chitcode/master/revert_assign_content/1
router.get('/master/revert_assign_content/:record_id', async function (req, res, next) {
    try {
        await db.query("select * from assign_content_create where id = ?",
            [req.params.record_id]
        )
        .then(result=>{
            if(result.length > 0)
            {
                if(result[0].developer_approval_status === 4)
                {
                    db.query("update assign_content_create set designer_approved_date = '', designer_actual_amount_get = '',designer_posted_question_details = '',designer_request_date='',developer_approval_status = 3, designer_payment = '',date_of_submission_designer = '' where id = ?",
                    [req.params.record_id]
                    )
                }
                if(result[0].developer_approval_status === 3)
                    {
                        db.query("update assign_content_create set date_of_submission_language_validator = '', language_validator_actual_amount_get = '',language_posted_question_details = '',language_validator_approved_date='',developer_approval_status = 2, language_validator_payment = '',assigned_language_validator = '' where id = ?",
                        [req.params.record_id]
                        )
                    }
                    if(result[0].developer_approval_status === 2)
                        {
                            db.query("update assign_content_create set assigned_validator = '',validator_payment = '',validator_request_date = '',validator_approved_date ='',developer_approval_status = 1, validator_posted_question_details = '', validator_actual_amount_get = '' where id = ?",
                            [req.params.record_id]
                            )
                        }
                
            }
        })
    }
    catch (err) {
        console.error(`Error while getting programming languages `, err.message);
        next(err);
    }
});

//Update Class
//https://lmsapi.clvdev.in/api/chitcode/master/update_class/650/9
router.get('/master/update_class/:student_id/:standard', async function (req, res, next) {
	try {
		let newpassword = "";
		let response_msg = "";
		let querydata = "";
		let standard = 0;
		let previous_class = 0;

			if (req.params.standard != "" && req.params.standard != undefined && req.params.standard != null) {

				await students.call_cronjob_archive_exam(req.params.student_id, req.params.standard - 1);
                await db.query("UPDATE students SET standard = "+req.params.standard+" where id = "+req.params.student_id+" ");
                res.status(200).send({data:"Class Updated successfully"});
			} else {
				res.status(200).send({data:"Please provide class"});
			}
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

//Delete E-Library/Questions record during DAM portal development
//https://lmsapi.clvdev.in/api/chitcode/master/delete_dam_content/9
router.get('/master/delete_dam_content/:record_id', async function (req, res, next) {
	try {
        let id = req.params.record_id;
        await db.query("select * from assign_content_create where id = ?",[id])
        .then(async result=>{
            let exam_category_id = result[0].exam_category_id;
            let board_id = result[0].board_id;
            let request_type = result[0].request_type;

            if(request_type === 'E')
            {
                db.query("delete from upload_elibrary_content where assign_content_id = ?",[id]);
                db.query("delete from developer_upload_elibrarycontent where content_request_id = ?",[id]);
            }
            else if(request_type === 'Q')
                {
                    db.query("delete from upload_questions_content where assign_content_id = ?",[id]);
                    db.query("delete from developer_upload_question where content_request_id = ?",[id]);
                }
                db.query("delete from assign_content_create where id = ?",[id]);
        })
                res.status(200).send({data:"Dam assign content deleted"});
			
	}
	catch (err) {
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
});

//Terminate E-Library/Questions record during DAM portal development before accept by developer
//https://lmsapi.clvdev.in/api/chitcode/master/terminate_dam_content_without_accept/9
router.get('/master/terminate_dam_content_without_accept/:record_id', async function (req, res, next) {
	var date_ob = new Date();
	let test_time = 1720158254000 + 300000;
    let id = req.params.record_id;
	let current_time = date_ob.getTime();
	var day = ("0" + date_ob.getDate()).slice(-2);
	var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	var year = date_ob.getFullYear();
	var date = year + "-" + month + "-" + day;
	var hours = date_ob.getHours();
	var minutes = date_ob.getMinutes();
	var seconds = date_ob.getSeconds();
	var assign_by = 1;
	var dateTime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
	await db.query("select * from `assign_content_create` where `approved_status` = 0 and `admin_approval_status` = 0 and id = ?",[id])
		.then(result => {
			if (result.length > 0) {
				result.forEach(async element => {
					let updated_at = element.updated_at;
					let timeDifference = Math.abs(updated_at.getTime() - date_ob.getTime());
					let differentDays = Math.ceil(timeDifference / (1000 * 3600 * 24));// Current
					assign_by = element.assigned_by;
					//if (differentDays > process.env.AUTOREJECTDAY) // Current
					//if( current_time > test_time)// Testing
					{
						await db.query("update `assign_content_create` set status = 1, approved_status = 2, `admin_approval_status` = 2 where `id` = " + element.id);
						let user_id = 0;
						let user_type = 0;
						let time_limit = "";
						let price = 0;
						if (element.developer_approval_status == 1) {
							user_id = element.assigned_developer;
							user_type = 1;
							time_limit = element.updated_at;
							price = element.payment_per_page;

						}
						else if (element.developer_approval_status == 2) {
							user_id = element.assigned_validator;
							user_type = 2;
							time_limit = element.updated_at;
							price = element.validator_payment;
						}
						else if (element.developer_approval_status == 3) {
							user_id = element.assigned_language_validator;
							user_type = 3;
							time_limit = element.updated_at;
							price = element.language_validator_payment;
						}
						else if (element.developer_approval_status == 4) {
							user_id = element.assigned_designer;
							user_type = 4;
							time_limit = element.updated_at;
							price = element.designer_payment;
						}
						if (element.request_type == 'Q') {
							await db.query("INSERT INTO `questions_history_log`(`recid`, `assign_to`,`user_type`, `time_limit`, `price`, `status`, `rejection_msg`, `content_data`) VALUES ('" + element.id + "','" + user_id + "','" + user_type + "','" + time_limit + "','" + price + "','Rejected','Auto rejected by system','')")
						} else if (element.request_type == 'E') {
							await db.query("INSERT INTO `library_history_log`(`recid`, `assign_to`,`user_type`, `time_limit`, `price`, `status`, `rejection_msg`, `content_data`) VALUES ('" + element.id + "','" + user_id + "','" + user_type + "','" + time_limit + "','" + price + "','Rejected','Auto rejected by system','')")
						}
						let reject_user_type = 0;
						if (user_type == 3) {
							reject_user_type = 4;
						}
						else if (user_type == 4) {
							reject_user_type = 3;
						}
						await db.query("INSERT INTO `rejected_request_list`(`assign_content_create_id`, `user_type`, `user_id`, `reason`) VALUES (" + element.id + "," + reject_user_type + "," + user_id + ",'Auto reject by system')");

						await db.query("INSERT INTO `notification_details`(`assign_content_id`, `user_id`,`assign_to_user`, `notification_msg`) VALUES (" + element.id + "," + assign_by + "," + user_id + ",'Auto reject by system')");
						//console.log(differentDays);
                        
					}
				})


			}
            res.status(200).send({data:"Dam assign content terminated"});
		})
});

//Terminate E-Library/Questions record during DAM portal development after accepted by developer
//https://lmsapi.clvdev.in/api/chitcode/master/terminate_dam_content_after_accept/9
router.get('/master/terminate_dam_content_after_accept/:record_id', async function (req, res, next) {
	var date_ob = new Date();
	let test_time = 1720158254000 + 300000;
    let id = req.params.record_id;
	let current_time = date_ob.getTime();
	var day = ("0" + date_ob.getDate()).slice(-2);
	var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	var year = date_ob.getFullYear();
	var date = year + "-" + month + "-" + day;
	var hours = date_ob.getHours();
	var minutes = date_ob.getMinutes();
	var seconds = date_ob.getSeconds();
	let assign_by = 1;

	var dateTime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
	await db.query("select * from `assign_content_create` where `status` = 0 and `approved_status` = 1 and id = ?",[id])
		.then(result => {
			if (result.length > 0) {
				result.forEach(async element => {
					assign_by = element.assigned_by;
					const current_date = date_ob.getTime();
					let expired_date = date_ob.getTime();

					let user_id = 0;
					let user_type = 0;
					let time_limit = "";
					let price = 0;
					if (element.developer_approval_status == 1) {
						user_id = element.assigned_developer;
						var date_ob_1 = new Date(element.date_of_submission);
						expired_date = Math.abs(date_ob_1.getTime());
						user_type = 1;
						time_limit = element.date_of_submission;
						price = element.payment_per_page;

					}
					else if (element.developer_approval_status == 2) {
						user_id = element.assigned_validator;
						var date_ob_1 = new Date(element.date_of_submission_validator);
						expired_date = Math.abs(date_ob_1.getTime());
						user_type = 2;
						time_limit = element.date_of_submission_validator;
						price = element.validator_payment;
					}
					else if (element.developer_approval_status == 3) {
						user_id = element.assigned_language_validator;
						var date_ob_1 = new Date(element.date_of_submission_language_validator);
						expired_date = Math.abs(date_ob_1.getTime());
						user_type = 3;
						time_limit = element.date_of_submission_language_validator;
						price = element.language_validator_payment;

					}
					else if (element.developer_approval_status == 4) {
						user_id = element.assigned_designer;
						var date_ob_1 = new Date(element.date_of_submission_designer);
						expired_date = Math.abs(date_ob_1.getTime());
						user_type = 4;
						time_limit = element.date_of_submission_designer;
						price = element.designer_payment;
					}

					//if (current_date > expired_date)
					//if( current_time > test_time)// Testing
					{
						if (element.request_type == 'Q') {
							let content_data = [];
							await db.query("select * from `dam_questions` where `is_approve` = 0 and `assign_content_id` = " + element.id)
								.then(async dam_result => {
									if (dam_result.length > 0) {
										dam_result.forEach(Element => {
											content_data.push({ "question_no": Element.question_no, "css_group_id": Element.css_group_id, "question_type": Element.question_type, "status": 1 });
										})
									}
								})
							if (element.status == 0) {

								if (element.request_type == 'Q') {
									await db.query("INSERT INTO `questions_history_log`(`recid`, `assign_to`,`user_type`, `time_limit`, `price`, `status`, `rejection_msg`, `content_data`) VALUES ('" + element.id + "','" + user_id + "','" + user_type + "','" + time_limit + "','" + price + "','Submited','Auto Submited by system','" + JSON.stringify(content_data) + "')")

									await db.query("update `upload_questions_content` set `content_status` = 1 where  `assign_content_id` = " + element.id)

								}
							}
							await db.query("update `assign_content_create` set `approved_status` = 1,`status` = 1 where `status` = 0 and `approved_status` = 1 and `id` = " + element.id)
								.then(async result => {
									if (result.affectedRows == 0) {
										await db.query("update `assign_content_create` set `status` = 1 where `status` = 0 and `approved_status` = 1 and `id` = " + element.id)
									} else {
										await db.query("update `dam_questions` set `status` = 1,`is_approve` = 0,`content_status` = 1 where `content_status` = 0 and `assign_content_id` = " + element.id)
									}
								})
							await db.query("INSERT INTO `notification_details`(`assign_content_id`, `user_id`,`assign_to_user`, `notification_msg`) VALUES (" + element.id + "," + assign_by + "," + user_id + ",'Auto submited by system')");

						} else {


							let content_data = "";
							await db.query("select * from `upload_elibrary_content` where user_id = " + user_id + " and  `assign_content_id` = " + element.id)
								.then(async dam_result => {
									if (dam_result.length > 0) {
										content_data = dam_result[0].content_data;
										await db.query("INSERT INTO `library_history_log`(`recid`, `assign_to`,`user_type`, `time_limit`, `price`, `status`, `rejection_msg`, `content_data`) VALUES ('" + element.id + "','" + user_id + "','" + user_type + "','" + time_limit + "','" + price + "','Submited','Auto Submited by system','" + content_data + "')")
									}
								})

							if (element.request_type == 'E') {
								await db.query("update `upload_elibrary_content` set `content_status` = 1 where  `assign_content_id` = " + element.id)
							}

							await db.query("update `assign_content_create` set `status` = 1 where `status` = 0 and `approved_status` = 1 and `id` = " + element.id).then(async result => {
								if (result.length > 0) {
									await db.query("INSERT INTO `notification_details`(`assign_content_id`, `user_id`,`assign_to_user`, `notification_msg`) VALUES (" + element.id + "," + assign_by + "," + user_id + ",'Auto submit by system')");
									await db.query("update `upload_elibrary_content` set `content_status` = 1 where `assign_content_id` = " + element.id)
								}
							})
						}
						
					}
				})
			}

		})
        res.status(200).send({data:"Dam assign content terminated"});
});

module.exports = router;