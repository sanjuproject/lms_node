const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const questions = require('../services/questions');
const demo_question_answers = require('../services/demo_questions_ans.js');
const online_exam_question_answers = require('../services/online_exam_question_answers.js');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const db = require('../services/db.js');
const download = require('image-downloader');
const classes = require('../services/classes.js');
const demoexampdffile = require('../services/demo_exam_pdffiles.js');
const { response } = require('express');
const purchased_subscribtions = require('../services/purchased_subscribtions.js');
const purchased_subscribtion_details = require('../services/purchase_subscribtion_details.js');
const branch = require('../services/branches.js');
const exam_completed = require('../services/exam_completed.js');
const helper = require('../helper');
const config = require('../config');
const datevalue = require('date-and-time');
require('dotenv').config();
const branchdata = require('../services/branches.js');
const chapterdata = require('../services/chapters.js');
const academic_session = require('../services/academic_sessions.js');
const demoExam=require('../services/admin.js');

// Demo scholatic exam questions for exam
router.post('/demoexamscholatic', async function(req,res,next){
    try{
		res.json(await questions.demoexamscholaticquestion(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Demo competitive exam questions for exam
router.post('/demoexamcompetitive', async function(req,res,next){
    try{
		res.json(await questions.demoexamcompetitivequestion(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Store Exam data after submit the exam
router.post('/storedemoexamanswers', async function(req,res,next){
    try{
		let questionsary = [];
	
		const student_id = req.body.student_id;
		const student_status = req.body.student_status;
		const exam_category_id = req.body.exam_category_id;
		await db.query("delete from `demo_question_answers` where `student_status`="+student_status+" and `student_id` = "+student_id+" and `exam_category_id` = "+exam_category_id+"")
		.then(async delete_record=>{
		let student_name = "";
		let student_mobile = "";
		await db.query("select * from `students` where id = "+student_id)
		.then(result=>{
			student_name = result[0].fname+" "+result[0].lname;		
			student_mobile = result[0].mobile;
		})
		req.body.examdata.forEach(element => {
		if(element.guest_post_ans_status == undefined || element.guest_post_ans_status =='')
		{
			element.guest_post_ans_status = 0;
		}	
			questionsary.push({"student_id":student_id,"question_id":element.question_id,
			"question_no":element.question_no,"guest_post_ans":element.guest_post_ans,"guest_post_ans_status":element.guest_post_ans_status,
		"student_status":student_status,"exam_category_id":exam_category_id});
			
		  });
		  //console.log(questionsary);
		 await db.query("select * from `demo_question_answers` where `student_status`="+student_status+" and `student_id` = "+student_id+" and `exam_category_id` = "+exam_category_id+"")
		 .then(async result=>{
			if(result.length == 0){
		await demo_question_answers.storedemoexamanswer(questionsary)
			.then((result)=>{
			demoExam.addFirstSignupData(student_id,exam_category_id);
				res.status(200).send({
					"status": 200,
					"msg": "Demo question answers saved",
					student_id:student_id
				})	
		});
		}else{
			await demo_question_answers.updatedemoexamanswer(questionsary)
			.then((result)=>{
				demoExam.addFirstSignupData(student_id,exam_category_id);
				res.status(200).send({
					"status": 200,
					"msg": "Demo question answers saved",
					student_id:student_id
				})
			});
		}

		/////////////////SEND SMS //////////////
		let smsbody = config.assessmentsheetready.body.replace("#field1#",student_name);
		let smsdata = {phonenumber:student_mobile,body:encodeURI(smsbody)}
		helper.sendsms(smsdata);
	////////////////////////////////////////////
	})
})
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// This route currently not in use
router.post('/demoexamassesmentpdf',adminMiddleware.validateToken, async function(req,res,next){
	try{
		let date_ob = new Date();
		let fulldate = date_ob.getFullYear()+"-"+date_ob.getMonth()+"-"+("0" + date_ob.getDate()).slice(-2);

		let unixTimestamp = Math.floor(new Date(fulldate+" 00:00:00.000").getTime()/1000);

		const student_id = req.body.student_id;
		
		const pdffilepath = 'demoexampdf/demoexam_'+unixTimestamp+'_'+student_id+'.pdf'; // format: demoexam_currentdate timestamp_student id.pdf
		let demoexam_record = await demoexampdffile.getdetailsbyparam(req.body);
	
		/*if (demoexam_record.data !='' && demoexam_record.data.length > 0) {
			res.status(200).send({status:200,pdfpath:pdffilepath})
		}
		else*/
		{
		await db.query("select demo_question_answers.*,questions.question,questions.question_image,questions.reason,\
		questions.supporting_reason,questions.answer from `demo_question_answers`\
		 left join questions on questions.id = demo_question_answers.question_id where `student_id` = "+student_id)
		.then((result)=>{
			
			// Create a document
			const doc = new PDFDocument();

			// Pipe its output somewhere, like to a file or HTTP response
			// See below for browser usage
			doc.pipe(fs.createWriteStream(pdffilepath));


			doc.image('assets/images/new-logo.png',0, 0, {
				fit: [100, 130],
				align: 'left',
				valign: 'center'
				});
				doc
				.text('',30, 100);

			// Embed a font, set the font size, and render some text
			let start = 50;
			let question_section = "";
			const image_base_url = "https://api.schemaphic.co.in";
			
			 let question_no = 1;
				result.forEach((element)=>{
					let guest_post_ans = "";
					let color = 'grey';
					if(element.guest_post_ans !='undefined'){
						guest_post_ans = element.guest_post_ans;
						
				
					if(element.guest_post_ans_status == 0){
						color='red';
					}
					else if(element.guest_post_ans_status == 1){
						color='green';
					}
				}
					question_section = element.question;
					
					doc
					.fontSize(8)
					.fill(color)
					.font('Courier-Bold')
					.text("Question : "+question_no+"\n")
					.font('Courier')
					.text(question_section)
					.font('Courier-Bold')
					.text("\nStudent post Answers : "+guest_post_ans+"\n", 30)
					.text("Right Answers : "+element.answer+"\n\n", 400)
					.font('Courier-Bold')
					.text("Reason: ",30)
					.text(element.reason+"\n\n\n", 30)
					//.image("/assets/AR/CH2/images/NT00ARCH2PQS2F1.png",{
					//	fit: [100, 130],	
					//	});

						doc.text('"\n\n\n\n\n\n"');	

					if(element.question_image != '' && element.question_image !=null)
					{	
						element.question_image = "/assets/AR/CH2/images/NT00ARCH2PQS2F1.png";
					options = {
						url: image_base_url+element.question_image,
						dest: element.question_image,     // will be saved to /path/to/dest/photo.jpg
					  };
					
					  download.image(options)
						.then(({ filename }) => {
						  //console.log('Saved to', filename); // saved to /path/to/dest/photo.jpg
					doc.image("/assets/AR/CH2/images/NT00ARCH2PQS2F1.png",{
						fit: [100, 130],
						});		
						doc.text('\n\n\n\n\n\n');
					})
				.catch((err) => console.error(err));
				}
				question_no++;
				});
				
			// Finalize PDF file
			doc.end();
		});
		db.query("INSERT INTO `demo_exam_pdffiles`(`student_id`, `pdf_file_path`, `exam_date`,`exam_date_timestamp`)\
		VALUES ("+student_id+",'"+pdffilepath+"','"+fulldate+"','"+unixTimestamp+"')");
		res.status(200).send({status:200,pdfpath:pdffilepath});

		}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	res.status(410).send({msg:`Error while getting programming languages :`+ err.message});
	}
});
// This route currently not in use
router.get('/archive_olddemoexampdf',adminMiddleware.validateToken, async function(req,res,next){
	try{
		let date_ob = new Date();
		let fulldate = date_ob.getFullYear()+"-"+date_ob.getMonth()+"-"+("0" + date_ob.getDate()).slice(-2);
		let unixTimestamp_current = Math.floor(new Date(fulldate+" 00:00:00.000").getTime()/1000);
		const demo_exam_pdf = await demoexampdffile.getdetails();

		demo_exam_pdf.data.forEach(async element=>{
			let examdate = element.exam_date_timestamp;
			let expire_date_timestamp = examdate + (86400 * 7);
			if(expire_date_timestamp < unixTimestamp_current)
			{
				await db.query("INSERT INTO `demo_exam_pdffiles_archive`(`student_id`, `pdf_file_path`, `exam_date`, `exam_date_timestamp`) VALUES\
				 ("+element.student_id+",'"+element.pdf_file_path+"','"+element.exam_date+"','"+element.exam_date_timestamp+"')")
				 .then((result)=>{
					db.query("delete from demo_exam_pdffiles where `id` = "+element.id);
				 });
			}
		});
		res.status(200).send({status:200,msg:"Archived old demo exam pdf file"});

		//console.log(unixTimestamp);
		//console.log(fulldate);
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

// Get demo exam assessment list against a student
router.post('/demoexamassessmentlist',adminMiddleware.validateToken, async function(req,res,next){
	try{
		const student_id = req.body.student_id;
		const student_status = req.body.student_status;
		const exam_category_id = req.body.exam_category_id;
		let question_counter = 1;
		let question_pattern_ary = [];
		await db.query("select * from question_pattern where status = 1 and is_deleted = 0")
		.then(result=>{
			result.forEach(element=>{
				question_pattern_ary[element.short_code] = (element.marks);
			})
		})

		let ts = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);  

		let date_ob = new Date(ts);
		let date = date_ob.getDate();
		let month = date_ob.getMonth() + 1;
		let year = date_ob.getFullYear();
		let total_marks = 0;
		let marks_obtained = 0;
		// prints date & time in YYYY-MM-DD format
		let current_date = (year + "-" + month + "-" + date+" 00:00:00");

			await db.query("select demo_question_answers.*,questions.question_type,questions.question,questions.question_image,questions.reason,\
			questions.supporting_reason,questions.answer,questions.option_a,questions.option_b,questions.option_c,questions.option_d\
			,questions.option_a_image,questions.option_b_image,questions.option_c_image,questions.option_d_image from `demo_question_answers`\
			left join questions on questions.id = demo_question_answers.question_id where `demo_question_answers`.`created_at` >'"+current_date+"' and  `exam_category_id` = "+exam_category_id+" and `student_status` = "+student_status+" and `student_id` = "+student_id)
			.then((result)=>{
				if(result.length > 0){
					result.forEach((element)=>{
						let options_details = [];
						let options_details_image = [];
						delete element.is_deleted;
						delete element.status;
						delete element.created_at;
						delete element.updated_at;
						//options_details.push({"A":element.option_a,"B":element.option_b,"C":element.option_c,
						//"D":element.option_d});
						//element['options'] = options_details;
			
						//options_details_image.push({"A":element.option_a_image,"B":element.option_b_image,
					   //"C":element.option_c_image,"D":element.option_d_image});
					//	element['options_image'] = options_details_image;
					if(element['guest_post_ans_status'] == 1){
						marks_obtained += question_pattern_ary[element['question_type']];
					}
					total_marks += question_pattern_ary[element['question_type']];
					let question_image_ary = "";
					if(element['question_image']){
						question_image_ary = element['question_image'].split(',');
					}
							let counter = 1;
							let final_question = element['question'];
						if(question_image_ary){
							question_image_ary.forEach(question_image=>{
								
								let tagname = "#Img"+counter;
								const replacer = new RegExp(tagname, 'g')

								final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="new_img" class="image_responsive" />')
								counter++;
							})
						}
							final_question = (final_question.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
							final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors'))
							 ////////////////////////////////////////////////////
							 let option_image_ary = "";
							 if(element['option_a_image']){
							 	option_image_ary = element['option_a_image'].split(',');
							 }
							 let counter_option_a = 1;
							 let final_question_option_a = element['option_a'];
							 if(option_image_ary){
							 option_image_ary.forEach(option_image=>{
								 let tagname = "#Img"+counter_option_a;
								 const replacer = new RegExp(tagname, 'g')
								 final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								 counter_option_a++;
							 })
							}
							 final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
							 final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							 ///////////////////////////////////////////////////////////
							 ////////////////////////////////////////////////////
							 let option_image_ary_b = "";
							 if(element['option_b_image']){
								option_image_ary_b = element['option_b_image'].split(',');
							 }
							 let counter_option_b = 1;
							 let final_question_option_b = element['option_b'];
							 if(option_image_ary_b){
							 option_image_ary_b.forEach(option_image=>{
								 let tagname = "#Img"+counter_option_b;
								 const replacer = new RegExp(tagname, 'g')
								 final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								 counter_option_b++;
							 })
							}
							 final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
							 final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							 ///////////////////////////////////////////////////////////
				 
							 ////////////////////////////////////////////////////
							 let option_image_ary_c = "";
							 if(element['option_c_image']){
							 	option_image_ary_c = element['option_c_image'].split(',');
							 }
							 let counter_option_c = 1;
							 let final_question_option_c = element['option_c'];
							 if(option_image_ary_c){
							 option_image_ary_c.forEach(option_image=>{
								 let tagname = "#Img"+counter_option_c;
								 const replacer = new RegExp(tagname, 'g');
								 final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								 counter_option_c++;
							 })
							}
							 final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
							 final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							 ///////////////////////////////////////////////////////////
				 
							  ////////////////////////////////////////////////////
							  let option_image_ary_d = ""; 
							  if(element['option_d_image']){
							  	option_image_ary_d = element['option_d_image'].split(',');
							  }
							  let counter_option_d = 1;
							  let final_question_option_d = element['option_d'];
							  if(option_image_ary_d){
							  option_image_ary_d.forEach(option_image=>{
								  let tagname = "#Img"+counter_option_d;
								  const replacer = new RegExp(tagname, 'g');
								  final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								  counter_option_d++;
							  })
							}
							  final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
							  final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							  ///////////////////////////////////////////////////////////

							   ////////////////////////////////////////////////////
							   let reason_image = "";  
							   if(element['supporting_reason']){
							   		reason_image = element['supporting_reason'].split(',');
							   }
							   let counter_reason = 1;
							   let final_reason = element['reason'];
							   if(reason_image){
							   reason_image.forEach(option_image=>{
								let tagname = "#Img"+counter_reason;
								const replacer = new RegExp(tagname, 'g');
								   final_reason = final_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="image_responsive" />')
								   counter_reason++;
							   })
							}
							   final_reason = (final_reason.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
							   final_reason = (final_reason.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							   ///////////////////////////////////////////////////////////
							 element['question'] = final_question;
							 element['option_a'] = final_question_option_a;
							 element['option_b'] = final_question_option_b;
							 element['option_c'] = final_question_option_c;
							 element['option_d'] = final_question_option_d;
							 element['reason'] = final_reason;
							 element['question_counter'] = question_counter;

							 options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
            "D":final_question_option_d});
            element['options'] = options_details;

			question_counter++;
					})

					result[0].marks = marks_obtained;
			result[0].total_marks = total_marks;
					res.status(200).send({status:200,msg:"Dive into your Demo Exam Details",data:result});
				}
				else{
					res.status(200).send({status:300,msg:"Demo assessment exam details not found"});
				}
			});

	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	res.status(410).send({msg:`Error while getting programming languages :`+ err.message});
	}
});
////////////////// CRON JOB /////////////////////////
//Archive Old exam Data
router.get('/archive_olddemoexam', async function(req,res,next){
	try{
		let date_ob = new Date();
		let fulldate = date_ob.getFullYear()+"-"+date_ob.getMonth()+"-"+("0" + date_ob.getDate()).slice(-2);
		let archive_date = Math.floor(new Date(fulldate+" 00:00:00.000").getTime()/1000) - (86400 * 7);
		
		var timestamp=new Date().getTime() - (86400 * 7 * 1000);
		var todate=new Date(timestamp).getDate();
		var tomonth=new Date(timestamp).getMonth()+1;
		var toyear=new Date(timestamp).getFullYear();
		var original_date=toyear+'-'+tomonth+'-'+("0" + todate).slice(-2) + " 00:00:00.000";
		
		const demo_exam_pdf = await demo_question_answers.getquestionslistbydate(original_date);

		res.status(200).send({status:200,msg:"Archived old demo exam successfully"});

		//console.log(unixTimestamp);
		//console.log(fulldate);
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
//Get archive Old exam scholastic exam data
router.post('/getscholasticexamsdetails_set',adminMiddleware.validateToken, async function(req,res,next){
	try{
		let userdata = req.user;
		let interm_exam_exist = 0;
		let exam_data = "";
		let interm_question_ids = [];
		let set_no = req.body.set_no;
		let subject_group_id = req.body.group_subject_id;
		let sequence_no = req.body.chapter_no;
		let finalno = req.body.chapter.match(/\d+/g);
        let chapter_code = "CH"+(finalno[1]);
		let interm_questions_list_ary = [];
		let search_query = "";
		let case_study_exam = 2;
		userdata.subject_id = req.body.subject_id;
		userdata.branch = req.body.branch;
		const student_id = req.user.id;
		const board = req.user.board;
		const classid = req.user.class;
		const subject_id = req.body.subject_id;
		let chapter_id = req.body.chapter_no;
		let branch = req.body.branch;
		userdata.branch = branch;
		userdata.chapter = req.body.chapter;
		userdata.sequence_no = req.body.chapter_no;
		if(typeof set_no == "string" && set_no.length > 1 && set_no.slice(0,2) == 'cs')
    	{
			set_no = set_no.slice(2,3);
			userdata.set_no = set_no;
			case_study_exam = 1;
			search_query = "select * from `interm_storeexamdata` where `case_study_exam` = "+case_study_exam+" and `subject_group_id` = "+subject_group_id+" and `set_no` = "+set_no+" and `student_id` = "+userdata.id+" and `exam_category_id` = 1 and `branch` = '"+req.body.branch+"' and `chapter` = '"+chapter_code+"' and `subject_id` = "+req.body.subject_id;
		}
		else{
			search_query = "select * from `interm_storeexamdata` where `case_study_exam` = "+case_study_exam+" and `subject_group_id` = "+subject_group_id+" and `set_no` = "+set_no+" and `student_id` = "+userdata.id+" and `exam_category_id` = 1 and `branch` = '"+req.body.branch+"' and `chapter` = '"+chapter_code+"' and `subject_id` = "+req.body.subject_id;
		}
		
		await db.query(search_query)
		 .then(async result=>{
			
			if(result.length > 0)
			{
				interm_exam_exist = 1;
				exam_data = result;
				let exam_questioon_data = {};
    			exam_questioon_data = JSON.parse(decodeURI(exam_data[0].examdata));
				exam_questioon_data.forEach(element=>{
					interm_question_ids.push(element.id);
				})

				let total_attempts = result[0].total_attempts + 1;
				let last_visited_ques_no = result[0].last_visited_ques_no;
				//let examdata = ((result[0].examdata));
				db.query("update `interm_storeexamdata` set total_attempts = "+total_attempts+" where `case_study_exam` = "+case_study_exam+" and `set_no` = "+set_no+" and `student_id` = "+userdata.id+" and `exam_category_id` = 1 and `branch` = '"+req.body.branch+"' and `chapter` = '"+chapter_code+"' and `subject_group_id` ="+req.body.group_subject_id+" and `subject_id` = "+req.body.subject_id);
				
				res.send(await questions.interm_examscholaticquestion(exam_data,req.user,total_attempts,last_visited_ques_no,total_attempts,req.body));
				//res.json(response);
			}else{
				interm_exam_exist = 0;
			}
		 })
		 if(interm_exam_exist === 0){
			if(typeof req.body.set_no == "string" && req.body.set_no.length > 1 && req.body.set_no.slice(0,2) =='cs')
			{
					let filter_casestudy_ids = 0;
					let filter_casestudy_idsary = [];
					
					await db.query("select * from `online_exam_question_answers_casestudy` where `student_id` = "+student_id+" and `subject_id` = "+subject_id+" group by `case_study_group_id`")
					.then(async result=>{
						if(result.length > 0)
						{
							result.forEach(element=>{
								filter_casestudy_idsary.push(element.case_study_group_id);
							})
						}
					})
					
				
					if(filter_casestudy_idsary!=''){
						filter_casestudy_ids = filter_casestudy_idsary.join(",");
					}
					await db.query("select * from `chapters` where `short_code` = '"+req.body.chapter+"' and `is_deleted` = 0 and status = 1")
						.then(element=>{
							if(element !=''){
							chapter_id = element[0].id;
							}
						})
						
					await db.query("select * from `questions` where `question_type` = 'CSS' and `status` = 1 and `demo_exam` = 0 and `is_approve` = 1 and `is_deleted` = 0 and `class` = "+classid+" and `branch` = '"+branch+"' and `exam_type_id` = "+board+" and `chapter_id` = "+chapter_id+" and !FIND_IN_SET(css_group_id,"+filter_casestudy_ids+") group by css_group_id order by rand() limit 0,2")
					.then(async result=>{
						if(result.length > 0)
						{
							const myPromise = new Promise((resolve, reject) => {
								let cssgroupid = [];
							result.forEach(element=>{
								cssgroupid.push("'"+element.css_group_id+"'");
							})
							resolve(cssgroupid);
						});
						myPromise.then(async (cssgroupid)=>{
							await db.query("select * from `questions` where `question_type` = 'CSS' and css_group_id IN ("+cssgroupid+")")
							.then(async final_result=>{
									res.json(await questions.casestudyquestoion_set(final_result,userdata));
							})
						});
							
						

						}else{
							let response = {status: config.successStatus, msg: "No case study exam data found",exam_duration:0, data:[]};
							res.json(response);
						}
					})
			}else{
				res.json(await questions.examscholaticquestion_set(req.body,req.user));
			}
		 }
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

// Store online exam questions answers for intermediate
router.post('/storeonlineexamanswers',adminMiddleware.validateToken, async function(req,res,next){
    try{
		let questionsary = [];
		let userdata = req.user;
		let board_id = userdata.board;
		const student_id = req.body.student_id;
		const exam_type = req.body.exam_type; // 1 = Set,2 = module,3= Mock 	
		const exam_unique_id = exam_type+"_"+Date.now()+"_"+student_id;
		const branch = req.body.branch;
		const chapter = req.body.chapter;
		let exam_set_counter = req.body.set_no;
		let case_study_exam = 2;
		let total_attempt = 1;
		
		if(typeof exam_set_counter[0] == "string" && exam_set_counter[0].length > 1 && exam_set_counter[0].slice(0,2) == 'cs')
    	{
			exam_set_counter = exam_set_counter[0].slice(2,3);
			case_study_exam = 1;
		}
		const subject_id = req.body.subject_id;
		const chapter_no =req.body.chapter_no;
		const exam_uniqueid = req.body.exam_unique_id;
		let group_subject_id = 0;
		if(req.body.group_subject_id != undefined){
			group_subject_id = req.body.group_subject_id;
		}	
		let questionsdetails = [];
		let finalno = chapter.match(/\d+/g);
        let chapter_code = "CH"+(finalno[1]);
		let branch_id = 0;
        let chapter_id = "";
		let search_query = "";
		let student_name = "";
		let student_mobile = "";
		await db.query("select * from `students` where id = "+student_id)
		.then(result=>{
			student_name = result[0].fname+" "+result[0].lname;		
			student_mobile = result[0].mobile;
		})
if(req.body.group_subject_id == undefined || req.body.group_subject_id == "" || req.body.group_subject_id == 0){
	await db.query("select * from `interm_storeexamdata` where `exam_unique_id` = '"+exam_uniqueid+"'")
	.then(async result=>{
		if(result.length > 0)
		{
			group_subject_id = result[0].subject_group_id;
			total_attempt = result[0].total_attempts;
		}
	})
}		

		await db.query("select * from `questions` where `branch` = '"+branch +"' and `chapter` = '"+chapter_code+"'")
		.then(result=>{
			result.forEach(element=>{
				questionsdetails[element['question_no']] = element['question_type']
			})
		})
		req.body.examdata.forEach(element => {
			if(element.guest_post_ans_status == undefined || element.guest_post_ans_status =='')
					{
						element.guest_post_ans_status = 0;
					}
			questionsary.push({"chapter":chapter,"branch":branch,"exam_type":exam_type,"exam_unique_id":exam_unique_id,"student_id":student_id,"question_id":element.question_id,
			"question_no":element.question_no,"guest_post_ans":element.guest_post_ans,"guest_post_ans_status":element.guest_post_ans_status,"exam_set_counter":exam_set_counter,
		"question_type":questionsdetails[element.question_no],"subject_id":subject_id,"group_subject_id":group_subject_id,user_data:userdata,"case_study_exam":case_study_exam,"total_attempt":total_attempt});
			
		  });
		  if(branch !="" || branch !=0){
					await branchdata.getbranchbycode(branch,board_id)
					.then((branch_data)=>{
					branch_id = branch_data.data[0].id;
	   			}) 
			}
	  if(chapter!='CH0')
	  {
		  await chapterdata.getchapterbycode(chapter)
		  .then(async chapter_data=>{
			chapter_id = chapter_data.data[0].id;
		  })
		  search_query = "select * from `exam_completed` where `student_id` = "+student_id+" and `exam_category_id` = 1 and `exam_type` = "+exam_type+" and `exam_set_counter` = "+exam_set_counter+" and `subject_id` = "+subject_id+" and `branch_id` = "+branch_id+" and `chapter_id` = "+chapter_id+" and `subject_group_id` = "+group_subject_id+" and case_study_exam = "+case_study_exam;
	  }else{
		search_query = "select * from `exam_completed` where `student_id` = "+student_id+" and `exam_category_id` = 1 and `exam_type` = "+exam_type+" and `exam_set_counter` = "+exam_set_counter+" and `subject_id` = "+subject_id+" and `branch_id` = "+branch_id+" and `subject_group_id` = "+group_subject_id+" and case_study_exam = "+case_study_exam;
	  }

	await db.query(search_query)
	.then(async resultdata=>{
	
	if(resultdata.length == 0)	
	{
		await online_exam_question_answers.storeonlineexamanswer(questionsary)
			.then(async(result)=>{
				res.status(200).send({
					"status": 200,
					"msg": "Online exam question answers saved",
                    student_id:result,
					exam_id:exam_unique_id
				})

				let querydata = "";
				if(exam_type == 1){
					querydata = ("select * from `interm_storeexamdata` where `chapter` ='"+chapter_code+"' and `branch` ='"+branch+"' and `student_id` = "+student_id+" and `exam_type` = "+exam_type+" and `set_no` = "+exam_set_counter+" and `subject_group_id` = "+group_subject_id+"");
				}else{
					querydata = ("select * from `interm_storeexamdata` where `student_id` = "+student_id+" and `exam_type` = "+exam_type+" and `set_no` = "+exam_set_counter+" and `subject_group_id` = "+group_subject_id+"");
				}
	
					await db.query(querydata)
					.then(async result=>{
					if(result.length > 0)
					{	
						var date = result[0].created_at;
						var isoDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
						isoDateTime = isoDateTime.slice(0,-1);
    					console.log("Delete Interm Data record");
						total_attempt = result[0].total_attempts;
						//let datetime = result[0].created_at.toISOString(); // '2:04pm'
						//console.log("update `exam_completed` set `created_at` = '"+isoDateTime+"' where `exam_unique_id` = '"+exam_unique_id+"'");
						await db.query("update `exam_completed` set `sequence_no`= "+total_attempt+", `created_at` = '"+isoDateTime+"' where `exam_unique_id` = '"+exam_unique_id+"'")
						.then(async result=>{
							await db.query("delete from `interm_storeexamdata` where `exam_unique_id` = '"+exam_unique_id+"'")
							if(exam_type == 1){
								await db.query("delete from `interm_storeexamdata` where `chapter` ='"+chapter_code+"' and `branch` ='"+branch+"' and `student_id` = "+student_id+" and `exam_type` = "+exam_type+" and `set_no` = "+exam_set_counter+" and `subject_group_id` = "+group_subject_id+"")
							}else{
								await db.query("delete from `interm_storeexamdata` where `student_id` = "+student_id+" and `exam_type` = "+exam_type+" and `set_no` = "+exam_set_counter+" and `subject_group_id` = "+group_subject_id+"")
							}
						})
					}
					})
			
				
				/////////////////SEND SMS //////////////
				let smsbody = config.assessmentsheetready.body.replace("#field1#",student_name);
				let smsdata = {phonenumber:student_mobile,body:encodeURI(smsbody)}
				helper.sendsms(smsdata);
			////////////////////////////////////////////
		});
	}else{
		res.status(200).send({
			"status": 200,
			"msg": "Online exam already given",
			"student_id":student_id,
			"exam_id":resultdata[0].exam_unique_id
		})
	}
	})

	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/* Get the Completed online exam list against a particular subject */
/*router.post('/getscholastic_examcount_completed', async function(req,res,next){
	try{
		res.json(await questions.examscholaticquestion_set(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});*/
// Get purchased subject group List against a particular student using student ID
router.post('/getpurchased_grouplist',adminMiddleware.validateToken, async function(req,res,next){
	try{
		let request_data = {student_id:req.user.id,exam_category_id:1};
		res.json(await purchased_subscribtion_details.get_group_subjectlists(request_data));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get scholastic Purchased subject List against a particular student using student ID
router.post('/getpurchased_subjectslist_scholastic',adminMiddleware.validateToken, async function(req,res,next){
	try{
		res.json(await purchased_subscribtions.getsubjectslist_groupwise(req.body,req.user));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
/* Get purchased subject List against a particular student using student ID  */
router.post('/getpurchased_subjectslist',adminMiddleware.validateToken, async function(req,res,next){
	try{
		res.json(await purchased_subscribtions.getsubjectslist(req.body,req.user));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get competitive purchased details against a particular student using student ID
router.post('/getpurchased_competitivelist',adminMiddleware.validateToken, async function(req,res,next){
	try{
		res.json(await purchased_subscribtions.getpurchased_competitivelist(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/* Fetch branch list against purchased subject   */
router.post('/getbranchlist_bysubject',adminMiddleware.validateToken, async function(req,res,next){
	try{
		res.json(await branch.getbranchesscholastic_bysubjectid(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/* Schelastic get completed sets,module and mock exams list agianst examcode,subject and branch code   */
router.post('/scholastic_getcompleted_chapters',adminMiddleware.validateToken, async function(req,res,next){
	try{
		res.json(await exam_completed.chaptercompleted_list(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/* Get completed exams list Scholastic Section  */
router.post('/scholastic_getcompleted_exam_details',adminMiddleware.validateToken, async function(req,res,next){
	try{
		res.json(await exam_completed.getcompletedexam_counter(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Online exam competitive section
// This is for NTSE section 
router.post('/onlineexamcompetitive',adminMiddleware.validateToken, async function(req,res,next){
    try{
		let userdata = req.user;
		let interm_exam_exist = 0;
		let postdata = req.body;
		postdata.category = 2;
		let exam_type_id = 1;
		await db.query("select * from `exam_type` where `type_name` = '"+req.body.exam_type+"'")
    	.then(result=>{
        	exam_type_id = result[0].id;
        	exam_type_shortcode = result[0].short_code;
    	})

		await db.query("select * from `interm_storeexamdata` where `student_id` = "+userdata.id+" and `exam_category_id` = 2 and `exam_type` = "+exam_type_id+" and `branch` = "+req.body.subtype_id+" and `board_id` = "+userdata.board+" and `set_no` = "+req.body.set_no)
		 .then(async result=>{
			if(result.length > 0)
			{
				//console.log(result);
				interm_exam_exist = 1;
				exam_data = result;
				let total_attempts = result[0].total_attempts + 1;
				let last_visited_ques_no = result[0].last_visited_ques_no;
				//let examdata = ((result[0].examdata));
				await db.query("update `interm_storeexamdata` set total_attempts = "+total_attempts+" where `student_id` = "+userdata.id+" and `exam_type` = "+exam_type_id+" and `exam_category_id` = 2 and `board_id` = "+userdata.board+" and `branch` =  "+req.body.subtype_id+" and `set_no` = "+req.body.set_no)
				.then(async result=>{
					res.send(await questions.interm_examscholaticquestion(exam_data,req.user,total_attempts,last_visited_ques_no,total_attempts,postdata));
				})
				
				//res.json(response);
			}else{
				interm_exam_exist = 0;
		res.json(await questions.onlineexamcompetitivequestion(req.body,req.user));
			}
		});
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Online exam competitive section
// For NSTSE section
router.post('/onlineexamcompetitive_nstse',adminMiddleware.validateToken, async function(req,res,next){
    try{
		let userdata = req.user;
		let interm_exam_exist = 0;
		let exam_type_name = req.body.exam_type;
		let exam_type_id = 0;
		await db.query("select * from `exam_type` where `type_name` = "+exam_type_name)
		 .then(async result=>{
			exam_type_id = result[0].id;
		 });
		await db.query("select * from `interm_storeexamdata` where `student_id` = "+userdata.id+" and `exam_category_id` = 2 and `exam_type` = "+exam_type_id+" and `set_no` = "+req.body.set_no)
		 .then(async result=>{
			
			if(result.length > 0)
			{
				interm_exam_exist = 1;
				exam_data = result;
				let total_attempts = result[0].total_attempts + 1;
				let last_visited_ques_no = result[0].last_visited_ques_no;
				//let examdata = ((result[0].examdata));
				db.query("update `interm_storeexamdata` set total_attempts = "+total_attempts+" where `student_id` = "+userdata.id+" and `exam_type` = "+exam_type_id+" and `exam_category_id` = 2 and `set_no` = "+req.body.set_no);
				res.send(await questions.interm_examscholaticquestion(exam_data,req.user,total_attempts,last_visited_ques_no,total_attempts));
				//res.json(response);
			}else{
					interm_exam_exist = 0;
					res.json(await questions.onlineexamcompetitivequestion_nstse(req.body));
			}
		});
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// get demo exam given count
router.post('/getdemoexamgivencount',adminMiddleware.validateToken, async function(req,res,next){
    try{
		res.json(await questions.getdemoexamgivencount(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get demo assessment details by category and student ID
router.post('/getdemoassessmentdetails',adminMiddleware.validateToken, async function(req,res,next){
    try{
		res.json(await questions.getdemoassessmentdetails(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get completed exam list against a particular student
router.post('/examcompletedlist',adminMiddleware.validateToken, async function(req,res,next){
    try{
		if(req.body.exam_category_id == 1)
		{
			res.json(await exam_completed.examcompletedlist_scholastic(req.body));
		}
		else if(req.body.exam_category_id == 2)
		{
			res.json(await exam_completed.examcompletedlist_competitive(req.body));
		}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get scholastic module exam details against a particular student
router.post('/getscholasticexamsdetails_module',adminMiddleware.validateToken, async function(req,res,next){
	try{
		let interm_exam_exist = 0;
		let userdata = req.user;
		
		await db.query("select * from `interm_storeexamdata` where `student_id` = "+userdata.id+" and `exam_category_id` = 1 and `exam_type` = 2 and `subject_group_id` = "+req.body.group_subject_id+" and `subject_id` = "+req.body.subject_id+" and `set_no` = "+parseInt(req.body.set_no))
		 .then(async result=>{
			
			if(result.length > 0)
			{
				interm_exam_exist = 1;
				exam_data = result;
				let total_attempts = result[0].total_attempts + 1;
				let last_visited_ques_no = result[0].last_visited_ques_no;
				//let examdata = ((result[0].examdata));
				
				await db.query("update `interm_storeexamdata` set total_attempts = "+total_attempts+" where `student_id` = "+userdata.id+" and `exam_type` = 2 and `exam_category_id` = 1 and `branch` = 0 and `subject_group_id` = "+req.body.group_subject_id+" and `subject_id` = "+req.body.subject_id +" and `set_no` = "+req.body.set_no);
				res.send(await questions.interm_examscholaticquestion(exam_data,req.user,total_attempts,last_visited_ques_no,total_attempts,req.body));
				//res.json(response);
			}else{
				interm_exam_exist = 0;
				
				res.json(await questions.examscholaticquestion_module(req.body,req.user));
			}
		 })
		
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get scholastic mock exam details against a particular student
router.post('/getscholasticexamsdetails_mock',adminMiddleware.validateToken, async function(req,res,next){
	try{
		let userdata = req.user;
		let interm_exam_exist = 0;
		
		await db.query("select * from `interm_storeexamdata` where `student_id` = "+userdata.id+" and `exam_category_id` = 1 and `exam_type` = 3 and `subject_group_id` = "+req.body.group_subject_id+" and `subject_id` = "+req.body.subject_id+" and `set_no` = "+parseInt(req.body.set_no))
		 .then(async result=>{
			
			if(result.length > 0)
			{
				interm_exam_exist = 1;
				exam_data = result;
			
				let total_attempts = result[0].total_attempts + 1;
				let last_visited_ques_no = result[0].last_visited_ques_no;
				//let examdata = ((result[0].examdata));
				db.query("update `interm_storeexamdata` set total_attempts = "+total_attempts+" where `student_id` = "+userdata.id+" and `exam_type` = 3 and `exam_category_id` = 1 and `branch` = 0 and `subject_group_id` = "+req.body.group_subject_id+" and `subject_id` = "+req.body.subject_id +" and `set_no` = "+parseInt(req.body.set_no));
				res.send(await questions.interm_examscholaticquestion(exam_data,req.user,total_attempts,last_visited_ques_no,total_attempts,req.body));
				//res.json(response);
			}else{
				interm_exam_exist = 0;
				res.json(await questions.examscholaticquestion_mock(req.body,req.user));
			}
		});
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

// Assessment online exam details for scholastic against a particular student 
router.post('/onlineexamassessmentlist_scholastic',adminMiddleware.validateToken, async function(req,res,next){
	try{
		const student_id = req.body.student_id;
		
		let subjects_ary = [];
		let correct_ans = 0;
		let incurrect_no = 0;
		let not_attented = 0;
		let total = 0;
		let total_question_css_group = 5;
		let subject_group_name_ary = [];
		await db.query("select * from `subjects` where `group_exist` = 3 and status = 1 and is_deleted = 0")
		.then(result=>{
			result.forEach(element=>{
				subject_group_name_ary[element.id] = element.name;
			})
			subject_group_name_ary[0] = "Individual Subject";
		})

		let chapters_ary = await db.query("select * from `subjects` where `subjects`.`status` = 1 and subjects.is_deleted = 0");
		chapters_ary.forEach(element=>{
			
				if(subjects_ary[element['id']] == null)
				{
					subjects_ary[element['id']] = [];
				}
				subjects_ary[element['id']] = element;
		})

		let question_pattern_ary = [];
		await db.query("select * from question_pattern where status = 1 and is_deleted = 0")
		.then(result=>{
			result.forEach(element=>{
				question_pattern_ary[element.short_code] = (element.marks);
				if(element.short_code == 'CSS')//Check Case study or not
				{
					//question_pattern_ary[element.short_code] = (element.marks/total_question_css_group);
				}
				
			})
		})
		//console.log(subjects_ary)
		//return;
		let ts = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);  

		let date_ob = new Date(ts);
		let date = date_ob.getDate();
		let month = date_ob.getMonth() + 1;
		let year = date_ob.getFullYear();

		// prints date & time in YYYY-MM-DD format
		let current_date = (year + "-" + month + "-" + date+" 00:00:00");
		let marks_obtained = 0;
		let total_marks = 0;
		const exam_unique_id = req.body.exam_unique_id;
		let feedback_rating_exist = 0;
		await db.query("select * from `feedback_rating` where `exam_unique_id` = '"+exam_unique_id+"'")
			.then(result=>{
				if(result.length > 0)
				{
					feedback_rating_exist = 1;
				}else{
					feedback_rating_exist = 0;
				}
			})

			await db.query("select exam_completed.exam_type,exam_completed.subject_id,exam_completed.branch_id,exam_completed.chapter_id,exam_completed.exam_set_counter,exam_completed.subject_group_id, online_exam_question_answers.`student_id`,\
			online_exam_question_answers.`exam_unique_id`,online_exam_question_answers.`question_id`,online_exam_question_answers.`question_no`,\
			online_exam_question_answers.`post_ans` as guest_post_ans, online_exam_question_answers.`post_ans_status` as guest_post_ans_status,questions.question_type,questions.question,questions.question_image,questions.reason,\
			questions.supporting_reason,questions.answer,questions.option_a,questions.option_b,questions.option_c,questions.option_d\
			,questions.option_a_image,questions.option_b_image,questions.option_c_image,questions.option_d_image,questions.css_group_id,chapters.chapter_name,chapters.sub_heading from `online_exam_question_answers`\
			left join questions on questions.id = online_exam_question_answers.question_id left join exam_completed on exam_completed.exam_unique_id = online_exam_question_answers.exam_unique_id\
			left join chapters on chapters.id = exam_completed.chapter_id where `exam_completed`.`updated_at` >'"+current_date+"' and `online_exam_question_answers`.`exam_unique_id` = '"+exam_unique_id+"' and `online_exam_question_answers`.`student_id` = "+student_id+" order by online_exam_question_answers.id asc")
			.then(async (result)=>{
				if(result.length > 0){
					let question_count = 1;
					let question_groups = [];
					result.forEach((element)=>{
						if(!question_groups.includes(element.css_group_id) && element.css_group_id !="" && element.css_group_id != null)
            			{
                			question_groups.push(element.css_group_id);
            			}
		
						let options_details = [];
						let options_details_image = [];
						delete element.is_deleted;
						delete element.status;
						delete element.created_at;
						delete element.updated_at;
						/*options_details.push({"A":element.option_a,"B":element.option_b,"C":element.option_c,
						"D":element.option_d});
						element['options'] = options_details;
			
						options_details_image.push({"A":element.option_a_image,"B":element.option_b_image,
					   "C":element.option_c_image,"D":element.option_d_image});
						element['options_image'] = options_details_image;*/
						if(element['guest_post_ans_status'] == 1){
							marks_obtained += question_pattern_ary[element['question_type']];
						}
						total_marks += question_pattern_ary[element['question_type']];
						let question_image_ary = "";
						if(element['question_image']){
							question_image_ary = element['question_image'].split(',');
						}
							let counter = 1;
							let final_question = element['question'];
						if(question_image_ary){
							question_image_ary.forEach(question_image=>{
								
								let tagname = "#Img"+counter;
								const replacer = new RegExp(tagname, 'g')

								final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="new_img" class="image_responsive" />')
								counter++;
							})
						}
							final_question = (final_question.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
							final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							
							 ////////////////////////////////////////////////////
							 let option_image_ary = "";
							 if(element['option_a_image']){
							 	option_image_ary = element['option_a_image'].split(',');
							 }
							 let counter_option_a = 1;
							 let final_question_option_a = element['option_a'];
							 if(option_image_ary){
							 option_image_ary.forEach(option_image=>{
								 let tagname = "#Img"+counter_option_a;
								 const replacer = new RegExp(tagname, 'g')
								 final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								 counter_option_a++;
							 })
							}
							final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors", 'assets/special_charectors'))
							 final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							 ///////////////////////////////////////////////////////////
							 ////////////////////////////////////////////////////
							 let option_image_ary_b = "";
							 if(element['option_b_image']){
							 	option_image_ary_b = element['option_b_image'].split(',');
							 }

							 let counter_option_b = 1;
							 let final_question_option_b = element['option_b'];
							 if(option_image_ary_b){
							 option_image_ary_b.forEach(option_image=>{
								 let tagname = "#Img"+counter_option_b;
								 const replacer = new RegExp(tagname, 'g')
								 final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								 counter_option_b++;
							 })
							}
							final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors", 'assets/special_charectors'));
							 final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							 ///////////////////////////////////////////////////////////
				 
							 ////////////////////////////////////////////////////
							 let option_image_ary_c = "";
							 if(element['option_c_image']){
							 	option_image_ary_c = element['option_c_image'].split(',');
							 }
							 let counter_option_c = 1;
							 let final_question_option_c = element['option_c'];
							 if(option_image_ary_c){
							 option_image_ary_c.forEach(option_image=>{
								 let tagname = "#Img"+counter_option_c;
								 const replacer = new RegExp(tagname, 'g');
								 final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								 counter_option_c++;
							 })
							}
							final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors", 'assets/special_charectors'));
							 final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							 ///////////////////////////////////////////////////////////
				 
							  ////////////////////////////////////////////////////
							  let option_image_ary_d = "";
							  if(element['option_d_image']){ 
							  	option_image_ary_d = element['option_d_image'].split(',');
							  }
							  let counter_option_d = 1;
							  let final_question_option_d = element['option_d'];
							  if(option_image_ary_d){
							  option_image_ary_d.forEach(option_image=>{
								  let tagname = "#Img"+counter_option_d;
								  const replacer = new RegExp(tagname, 'g');
								  final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								  counter_option_d++;
							  })
							}
							final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors", 'assets/special_charectors'));
							  final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							  ///////////////////////////////////////////////////////////

							   ////////////////////////////////////////////////////
							   let reason_image = "";
							   if(element['supporting_reason']){ 
							   		reason_image = element['supporting_reason'].split(',');
							   }
							   let counter_reason = 1;
							   let final_reason = element['reason'];
							   if(reason_image){
							   reason_image.forEach(option_image=>{
								let tagname = "#Img"+counter_reason;
								const replacer = new RegExp(tagname, 'g');
								   final_reason = final_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="image_responsive" />')
								   counter_reason++;
							   })
							}
							final_reason = (final_reason.replaceAll("../assets/special_charectors", 'assets/special_charectors'));
							   final_reason = (final_reason.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/')) 

							   
							 if(final_reason.search(process.env.IMAGEBASEURL)== "" || final_reason.search(process.env.IMAGEBASEURL) == undefined || final_reason.search(process.env.IMAGEBASEURL) == null || final_reason.search(process.env.IMAGEBASEURL) == -1){
								
								final_reason = (final_reason.replaceAll("question_images/supporting_reason_image/", process.env.IMAGEBASEURL+'question_images/supporting_reason_image/')) 
							 }  
							   
							   ///////////////////////////////////////////////////////////
							 element['question'] = final_question;
							 element['option_a'] = final_question_option_a;
							 element['option_b'] = final_question_option_b;
							 element['option_c'] = final_question_option_c;
							 element['option_d'] = final_question_option_d;
							 element['reason'] = final_reason;

							 options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
            "D":final_question_option_d});
            element['options'] = options_details;
			
				element['subject_name'] = subjects_ary[element['subject_id']]['name'];
				if(element['exam_type'] == 1){
					element['branch_name'] = subjects_ary[element['branch_id']]['name'];
					element['chapter_name'] = element['sub_heading'];
					element['exam_type_name'] = "Test-"+result[0].exam_set_counter;
				}
			

			if(element['exam_type'] == 2){
				element['exam_type_name'] = "Module-"+result[0].exam_set_counter;
			}
			else if(element['exam_type'] == 3){
				element['exam_type_name'] = "Mock-"+result[0].exam_set_counter;
			}
			else if(element['question_type'] == 'CSS'){
				element['exam_type_name'] = "Case Study";
			}

						element['subject_group_name'] = subject_group_name_ary[element.subject_group_id];
						
						element['question_counter'] = question_count;
						if(element.question_type == 'CSS'){
							element['question_counter'] = question_count + (parseInt(question_groups.indexOf(element.css_group_id)))+"."+convert_text_toroman(element.question_no.slice(-1));
						}
						if(element.question_type != 'CSS')
						{
							question_count++;
						}
		})
					result[0].marks = marks_obtained;
					
					result[0].total_marks = total_marks;
					result[0].exam_feedback = feedback_rating_exist;
					
					

			
			//////////////////// DELETE INTERM EXAM DATA STORED ///////////////			
			if(result[0].exam_type == 1){
				let branch = result[0].question_no.substring(4,6);
				let chapter_code = result[0].question_no.substring(6,9);
				await db.query("delete from `interm_storeexamdata` where `chapter` ='"+chapter_code+"' and `branch` ='"+branch+"' and `student_id` = "+result[0].student_id+" and `exam_type` = "+result[0].exam_type+" and `set_no` = "+result[0].exam_set_counter+" and `subject_group_id` = "+result[0].subject_group_id+"")
			}else{
				await db.query("delete from `interm_storeexamdata` where `student_id` = "+result[0].student_id+" and `exam_type` = "+result[0].exam_type+" and `set_no` = "+result[0].exam_set_counter+" and `subject_group_id` = "+result[0].subject_group_id+"")
			}
			//////////////////// DELETE INTERM EXAM DATA STORED ///////////////	

			res.status(200).send({status:200,msg:"Scholastic Evaluation Overview: Explore your online assessment details",data:result});
		
				}
				else{
					res.status(200).send({status:300,msg:"Online scholastic assessment exam details not found"});
				}
			});

	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	res.status(410).send({msg:`Error while getting programming languages :`+ err.message});
	}
});
function convert_text_toroman(text){
    let number_ary = {"A":"i","B":"ii","C":"iii","D":"iv","E":"v","F":"vi","G":"vii","H":"viii","I":"ix","J":"x"};
    return number_ary[text];
}

// Store online exam answers for competitive against a particular student exam
router.post('/storeonlineexamanswers_competitive',adminMiddleware.validateToken, async function(req,res,next){
    try{
		let questionsary = [];
		const student_id = req.body.student_id;
		const exam_type = req.body.exam_type;
		let exam_type_id = 0;
		const exam_subtype = req.body.exam_subtype;
		const subscription_id = req.body.subscription_id;
		const exam_unique_id = exam_type+"_"+Date.now()+"_"+student_id;
		const branch = req.body.branch;
		const chapter = req.body.chapter;
		let total_attempt = 1;
		await db.query("select * from `exam_type` where `type_name` = '"+exam_type+"'")
		.then(result=>{
			exam_type_id = result[0].id;
		})
		await db.query("select * from `students` where id = "+student_id)
		.then(result=>{
			student_name = result[0].fname+" "+result[0].lname;		
			student_mobile = result[0].mobile;
		})
		const exam_set_counter = req.body.set_no; // Set no which exam  
				req.body.examdata.forEach(element => {
					if(element.guest_post_ans_status == undefined || element.guest_post_ans_status =='')
					{
						element.guest_post_ans_status = 0;
					}
					//console.log(element);
			questionsary.push({"exam_type":exam_type,"exam_subtype":exam_subtype,"subscription_id":subscription_id,"exam_unique_id":exam_unique_id,"student_id":student_id,"question_id":element.question_id,
			"question_no":element.question_no,"guest_post_ans":element.guest_post_ans,"guest_post_ans_status":element.guest_post_ans_status,"exam_set_counter":exam_set_counter});
			
		  });

		  await db.query("select * from `exam_completed_competitive` where `student_id` = "+student_id+" and `exam_type` = '"+exam_type+"' and `exam_subtype_id` = "+exam_subtype+" and`exam_category_id` = 2 and `exam_set_counter` = "+exam_set_counter)
		  .then(async exam_data=>{
		 if(exam_data.length == 0)
		 {	  
		await online_exam_question_answers.storeonlineexamanswer_competitive(questionsary)
			.then(async (result)=>{
				res.status(200).send({
					"status": 200,
					"msg": "Online exam question answers saved",
					student_id:result,
					exam_id:exam_unique_id
				})
				await db.query("select * from `interm_storeexamdata` where `student_id` = "+student_id+" and `exam_type` = "+exam_type_id+" and `set_no` = "+exam_set_counter+" and `branch` = "+exam_subtype)
				.then(async result=>{
					//let datetime = result[0].created_at.toISOString(); // '2:04pm'
					var date = result[0].created_at;
					var isoDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
					isoDateTime = isoDateTime.slice(0,-1);
					console.log("Delete interm data after exam");
					total_attempt = result[0].total_attempts;

					await db.query("delete from `interm_storeexamdata` where `student_id` = "+student_id+" and `exam_type` = "+exam_type_id+" and `set_no` = "+exam_set_counter+" and `branch` = "+exam_subtype)

						await db.query("update `exam_completed_competitive` set `created_at` = '"+isoDateTime+"',` 	total_attempts` = "+total_attempt+" where `exam_unique_id` = '"+exam_unique_id+"'")
						.then(async result=>{
						
							await db.query("delete from `interm_storeexamdata` where `student_id` = "+student_id+" and `exam_type` = "+exam_type_id+" and `set_no` = "+exam_set_counter+" and `branch` = "+exam_subtype)
						})
				})	 
		});

		/////////////////SEND SMS //////////////
		let smsbody = config.assessmentsheetready.body.replace("#field1#",student_name);
		let smsdata = {phonenumber:student_mobile,body:encodeURI(smsbody)}
		helper.sendsms(smsdata);
	////////////////////////////////////////////

	}else{
		res.status(200).send({
			"status": 200,
			"msg": "Competitive exam already given.",
			"student_id":student_id,
			"exam_id":exam_data[0].exam_unique_id
		
		})
	}
	})

	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

// Assessment online exam details for competitive against a particular student 
router.post('/onlineexamassessmentlist_competitive',adminMiddleware.validateToken, async function(req,res,next){
	try{
		let subtypeary = [];
		let marks_obtained = 0;
		let total_marks = 0;
		let question_count = 1;
  await db.query("select * from `exam_subtype` where `is_deleted` = 0 and status = 1")
  .then(result=>{
    result.forEach(element=>{
      subtypeary[element.id] = element.subtype_name;
    })
  })

  let question_pattern_ary = [];
		await db.query("select * from question_pattern where status = 1 and is_deleted = 0")
		.then(result=>{
			result.forEach(element=>{
				question_pattern_ary[element.short_code] = (element.marks);
			})
		})
		const student_id = req.body.student_id;	
		const exam_unique_id = req.body.exam_unique_id;
		var datetime = new Date();
		let current_date = (datetime.toISOString().slice(0,10));

		let ts = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);  

		let date_ob = new Date(ts);
		let date = date_ob.getDate();
		let month = date_ob.getMonth() + 1;
		let year = date_ob.getFullYear();

		// prints date & time in YYYY-MM-DD format
		let search_current_date = (year + "-" + month + "-" + date+" 00:00:00");
		let feedback_rating_exist = 0;
		await db.query("select * from `feedback_rating` where `exam_unique_id` = '"+exam_unique_id+"'")
			.then(result=>{
				if(result.length > 0)
				{
					feedback_rating_exist = 1;
				}else{
					feedback_rating_exist = 0;
				}
			})
			await db.query("select exam_completed_competitive.exam_subtype_id,exam_completed_competitive.exam_type,exam_completed_competitive.exam_set_counter,exam_completed_competitive.created_at,online_exam_question_answers_competitive.`student_id`, online_exam_question_answers_competitive.`exam_unique_id`,online_exam_question_answers_competitive.`question_id`,\
			online_exam_question_answers_competitive.`question_no`,online_exam_question_answers_competitive.`post_ans` as guest_post_ans, online_exam_question_answers_competitive.`post_ans_status` as guest_post_ans_status,questions.question,questions.question_image,questions.reason,questions.question_type,\
			questions.supporting_reason,questions.answer,questions.option_a,questions.option_b,questions.option_c,questions.option_d\
			,questions.option_a_image,questions.option_b_image,questions.option_c_image,questions.option_d_image from `online_exam_question_answers_competitive`\
			left join questions on questions.id = online_exam_question_answers_competitive.question_id left join  exam_completed_competitive on  exam_completed_competitive.exam_unique_id = online_exam_question_answers_competitive.`exam_unique_id`\
			 where `online_exam_question_answers_competitive`.`created_at` > '"+search_current_date+"' and `online_exam_question_answers_competitive`.`exam_unique_id` = '"+exam_unique_id+"' and `online_exam_question_answers_competitive`.`student_id` = "+student_id)
			.then((result)=>{
				if(result.length > 0){
					result.forEach((element)=>{
						let options_details = [];
						let options_details_image = [];
						delete element.is_deleted;
						delete element.status;
						//delete element.created_at;
						delete element.updated_at;
						/*options_details.push({"A":element.option_a,"B":element.option_b,"C":element.option_c,
						"D":element.option_d});
						element['options'] = options_details;
			
						options_details_image.push({"A":element.option_a_image,"B":element.option_b_image,
					   "C":element.option_c_image,"D":element.option_d_image});
						element['options_image'] = options_details_image;*/

						if(element['guest_post_ans_status'] == 1){
							marks_obtained += question_pattern_ary[element['question_type']];
						}
						total_marks += question_pattern_ary[element['question_type']];
						
						let question_image_ary = "";
						if(element['question_image'])
						{
							question_image_ary = element['question_image'].split(',');
						}
							let counter = 1;
							let final_question = element['question'];
						if(question_image_ary){
							question_image_ary.forEach(question_image=>{
								
								let tagname = "#Img"+counter;
								const replacer = new RegExp(tagname, 'g')

								final_question = final_question.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+question_image.substring(1)+'" alt="new_img" class="image_responsive" />')
								counter++;
							})
						}
						final_question = (final_question.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))	
						final_question = (final_question.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							 ////////////////////////////////////////////////////
							 let option_image_ary = "";
							 if(element['option_a_image']){
							 	option_image_ary = element['option_a_image'].split(',');
							 }
							 let counter_option_a = 1;
							 let final_question_option_a = element['option_a'];
							 if(option_image_ary){
							 option_image_ary.forEach(option_image=>{
								 let tagname = "#Img"+counter_option_a;
								 const replacer = new RegExp(tagname, 'g')
								 final_question_option_a = final_question_option_a.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								 counter_option_a++;
							 })
							}
							 final_question_option_a = (final_question_option_a.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))	
							 final_question_option_a = (final_question_option_a.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							 ///////////////////////////////////////////////////////////
							 ////////////////////////////////////////////////////
							 let option_image_ary_b = "";
							 if(element['option_b_image']){
							 	option_image_ary_b = element['option_b_image'].split(',');
							 }
							 let counter_option_b = 1;
							 let final_question_option_b = element['option_b'];
							 if(option_image_ary_b){
							 option_image_ary_b.forEach(option_image=>{
								 let tagname = "#Img"+counter_option_b;
								 const replacer = new RegExp(tagname, 'g')
								 final_question_option_b = final_question_option_b.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								 counter_option_b++;
							 })
							}
							final_question_option_b = (final_question_option_b.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))
							 final_question_option_b = (final_question_option_b.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							 ///////////////////////////////////////////////////////////
				 
							 ////////////////////////////////////////////////////
							 let option_image_ary_c = "";
							 if(element['option_c_image']){
							 	option_image_ary_c = element['option_c_image'].split(',');
							 }
							 let counter_option_c = 1;
							 let final_question_option_c = element['option_c'];
							 if(option_image_ary_c){
							 option_image_ary_c.forEach(option_image=>{
								 let tagname = "#Img"+counter_option_c;
								 const replacer = new RegExp(tagname, 'g');
								 final_question_option_c = final_question_option_c.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								 counter_option_c++;
							 })
							}
							final_question_option_c = (final_question_option_c.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))
							 final_question_option_c = (final_question_option_c.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							 ///////////////////////////////////////////////////////////
				 
							  ////////////////////////////////////////////////////
							  let option_image_ary_d = ""; 
							  if(element['option_d_image']){
							  		option_image_ary_d = element['option_d_image'].split(',');
							  }
							  let counter_option_d = 1;
							  let final_question_option_d = element['option_d'];
							  if(option_image_ary_d){
							  option_image_ary_d.forEach(option_image=>{
								  let tagname = "#Img"+counter_option_d;
								  const replacer = new RegExp(tagname, 'g');
								  final_question_option_d = final_question_option_d.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="option_image_responsive" />')
								  counter_option_d++;
							  })
							}
							  final_question_option_d = (final_question_option_d.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))
							  final_question_option_d = (final_question_option_d.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))
							  ///////////////////////////////////////////////////////////

							   ////////////////////////////////////////////////////
							   let reason_image = "";  
							   if(element['supporting_reason']){
									reason_image = element['supporting_reason'].split(',');
							   }
							   let counter_reason = 1;
							   let final_reason = element['reason'];
							   if(reason_image){
							   reason_image.forEach(option_image=>{
								let tagname = "#Img"+counter_reason;
								const replacer = new RegExp(tagname, 'g');
								   final_reason = final_reason.replace(replacer,' <img src="'+process.env.IMAGEBASEURL+option_image.substring(1)+'" alt="new_img" class="image_responsive" />')
								   counter_reason++;
							   })
							}
							   final_reason = (final_reason.replaceAll("../assets/special_charectors", 'assets/special_charectors/'))
							   final_reason = (final_reason.replaceAll("assets/special_charectors", process.env.IMAGEBASEURL+'assets/special_charectors/'))

							   if(final_reason.search(process.env.IMAGEBASEURL)== "" || final_reason.search(process.env.IMAGEBASEURL) == undefined || final_reason.search(process.env.IMAGEBASEURL) == null || final_reason.search(process.env.IMAGEBASEURL) == -1){
								
								final_reason = (final_reason.replaceAll("question_images/supporting_reason_image/", process.env.IMAGEBASEURL+'question_images/supporting_reason_image/')) 
							 }
							   ///////////////////////////////////////////////////////////
							 element['question'] = final_question;
							 element['option_a'] = final_question_option_a;
							 element['option_b'] = final_question_option_b;
							 element['option_c'] = final_question_option_c;
							 element['option_d'] = final_question_option_d;
							 element['reason'] = final_reason;
							 element['exam_subtype'] = subtypeary[element['exam_subtype_id']];


							 options_details.push({"A":final_question_option_a,"B":final_question_option_b,"C":final_question_option_c,
            "D":final_question_option_d});
            element['options'] = options_details;
			element['question_counter'] = question_count;	
			question_count++;
					})
					result[0].subject_group_name = "";
					result[0].marks = marks_obtained;
					result[0].total_marks = total_marks;
					result[0].exam_feedback = feedback_rating_exist;
					res.status(200).send({status:200,msg:"Competitive Exam Analysis: Total performance",data:result});
				}
				else{
					res.status(200).send({status:300,msg:"Online Competitive assessment exam details not found"});
				}
			});

	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	res.status(410).send({msg:`Error while getting programming languages :`+ err.message});
	}
});

//Get Scholastic exam assessment list for student specific
router.post('/getscholasticexam_assessmentlist',adminMiddleware.validateToken, async function(req,res,next){
	try{
		res.json(await exam_completed.examcompletedlist_scholastic(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get All exam assessment list
router.post('/getexamassessmentlist',adminMiddleware.validateToken, async function(req,res,next){
    try{
		let user_id = req.user.id;
		let board_id = req.user.board;
		let exam_completed_list_sch = {};
		let exam_completed_list_com = {};
		let subject_group_name_ary = [];
		let date_gap = 7; // Allow to view 7 Days old assessment
		let board_name = "";
		let exam_subtype = [];
		let assessment_ary = [];
		let is_expired = 0;
		let is_expired_com = 0;
		let i = 0;
		let query_data = "";
		let category_id = req.body.category_id;
		let subject_group_id = req.body.group_subject_id;
		let subject_id = req.body.subject_id;

		if(category_id == 1) // SCHLASTIC
		{
			if(subject_group_id != undefined && subject_group_id != "" && subject_group_id.length > 0){
				query_data = " and subject_group_id = "+subject_group_id;
			}
			if(subject_id != undefined && subject_id != "" && subject_id > 0){
				query_data += " and subject_id = "+subject_id;
			}
			
		}
		await db.query("select * from `boards` where `id` = "+board_id)
		.then(result=>{
			result.forEach(element=>{
				board_name = element.name;
			})
		})
		await db.query("select * from `exam_subtype` where `is_deleted` = 0 and status = 1 and exam_type_id = 1")
		.then(result=>{
			result.forEach(element=>{
				exam_subtype[element.id] = (element.subtype_name);
			})
		})
		//console.log(exam_subtype)
		//return;
		let ts = new Date(Date.now() - date_gap * 24 * 60 * 60 * 1000);  /// 7 Days GAP

		let date_ob = new Date(ts);
		let date = date_ob.getDate();
		let month = date_ob.getMonth() + 1;
		let year = date_ob.getFullYear();

		// prints date & time in YYYY-MM-DD format
		let current_date = (year + "-" + month + "-" + date+" 00:00:00");

	
		await db.query("select * from `subjects` where `group_exist` = 3 and status = 1 and is_deleted = 0")
		.then(result=>{
			result.forEach(element=>{
				subject_group_name_ary[element.id] = element.name;
			})
			subject_group_name_ary[0] = "Individual Subject";
		})
		////////////////// GET Scholastic Exam Completed List ///////////////////
		await db.query("select exam_completed.*,subjects.name as subject_name,subjects.subject_color_code as subject_color_code,exam_categories.category,chapters.sub_heading as chapter_name from `exam_completed` left join subjects on subjects.id = exam_completed.subject_id\
		 left join exam_categories on exam_categories.id = exam_completed.exam_category_id left join chapters on  chapters.id = exam_completed.chapter_id where `student_id` = "+user_id+query_data+" order by id desc")
		.then(result=>{
			
			result.forEach(element=>{
				let ts = new Date(Date.now());
				
				let createddate = new Date(element.created_at);
				let date_create = new Date(createddate);
				let create_date = date_create.getFullYear()+"-"+(date_create.getMonth()+1)+"-"+date_create.getDate();
				let updateddate = new Date(element.updated_at);
				
				let date_ob = new Date(ts);
				let date_ob2 = new Date(updateddate);
				let date = date_ob.getDate();
				let month = date_ob.getMonth() + 1;
				let year = date_ob.getFullYear();
	
				let created_date = date_ob2.getDate();
				let created_month = date_ob2.getMonth() + 1;
				let created_year = date_ob2.getFullYear();
				let update_date = created_year+"-"+created_month+"-"+created_date;
				// prints date & time in YYYY-MM-DD format
				let current_date = (year + "-" + month + "-" + date);
				const date1 = new Date(current_date);
				const date2 = new Date(created_year+"-"+created_month+"-"+created_date);
				const diffTime = Math.abs(date2 - date1);
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
				//console.log(diffDays);
				// i = (new Date(element.created_at).getTime());
				exam_completed_list_sch[i] = {};
				exam_completed_list_sch[i]['exam_name'] = board_name;
				let exam_type = "";
				let chapter_name = "";
				if(element.exam_type == 1){
					exam_type = "Chapter Test "+element.exam_set_counter;
					chapter_name = element.chapter_name;
					if(element.case_study_exam == 1)
					{
						exam_type = "Case Study";
					}
				}
				else if(element.exam_type == 2){
					exam_type = "Module Test "+element.exam_set_counter;
				}
				else if(element.exam_type == 3){
					exam_type = "Mock Test "+element.exam_set_counter;
				}
				let datediffvalue = date_gap - diffDays +" day(s)";
				let datediff = date_gap - diffDays;
				if(parseInt(datediff) <= 0){
					datediffvalue = "Expired";
					is_expired = 1;
				}

		
				
				exam_completed_list_sch[i]['category_id'] = element.exam_category_id;
				exam_completed_list_sch[i]['category'] = element.category;
				exam_completed_list_sch[i]['subject_group_name'] = subject_group_name_ary[element.subject_group_id];
				exam_completed_list_sch[i]['subject_name'] = element.subject_name;
				exam_completed_list_sch[i]['subject_color_code'] = element.subject_color_code;
				exam_completed_list_sch[i]['chapter_name'] = chapter_name;
				exam_completed_list_sch[i]['exam_type'] = exam_type;
				exam_completed_list_sch[i]['student_id'] = element.student_id;
				exam_completed_list_sch[i]['exam_unique_id'] = element.exam_unique_id;
				exam_completed_list_sch[i]['appeared_on'] = element.created_at;
				exam_completed_list_sch[i]['submitted_on'] = element.updated_at;
				exam_completed_list_sch[i]['status'] = 1;
				exam_completed_list_sch[i]['assessment_available'] = datediffvalue;
				exam_completed_list_sch[i]['is_expired'] = is_expired;
				exam_completed_list_sch[i]['createddatetimestamp'] = new Date(element.updated_at).getTime();
				i++;
				is_expired = 0;
			})
		})


///////////////////////// GET COMPETITIVE EXAM ASSESSMENT DETAILS ////////////////////////
let result = await db.query("select exam_completed_competitive.*,exam_categories.category from `exam_completed_competitive` left join exam_categories on exam_categories.id = exam_completed_competitive.exam_category_id\
  where `exam_completed_competitive`.`exam_category_id` = 2 and `student_id` = "+user_id);
  if (result.length > 0) {
    let completed_exam = [];
    let counter = i;
    result.forEach(element=>{
		let ts = new Date(Date.now());

				let date_ob = new Date(ts);
				let date = date_ob.getDate();
				let month = date_ob.getMonth() + 1;
				let year = date_ob.getFullYear();

				
				let createddate = new Date(element.updated_at);
				
				let date_ob2 = new Date(createddate);
				
				let created_date = date_ob2.getDate();
				let created_month = date_ob2.getMonth() + 1;
				let created_year = date_ob2.getFullYear();
		
				// prints date & time in YYYY-MM-DD format
				let current_date = (year + "-" + month + "-" + date);
				const date1 = new Date(current_date);
				const date2 = new Date(created_year+"-"+created_month+"-"+created_date);
				const diffTime = Math.abs(date2 - date1);
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				//counter = (new Date(element.created_at).getTime());
				exam_completed_list_com[counter] = {};
				exam_completed_list_com[counter]['category_id'] = element.exam_category_id;
				exam_completed_list_com[counter]['category'] = element.category;
				exam_completed_list_com[counter]['exam_name'] = element.exam_type;
				exam_completed_list_com[counter]['subject_name'] = "-";
				exam_completed_list_com[counter]['subject_color_code'] = "-";
				exam_completed_list_com[counter]['chapter_name'] = "-";
				if(exam_subtype[element.exam_subtype_id] !='' && exam_subtype[element.exam_subtype_id] !=undefined){
					exam_completed_list_com[counter]['exam_type'] = exam_subtype[element.exam_subtype_id]+",Set-"+element.exam_set_counter;
				}else{
					exam_completed_list_com[counter]['exam_type'] = "Set-"+element.exam_set_counter;
				}

				let datediffvalue = date_gap - diffDays +" day(s)";
				let datediff = date_gap - diffDays;
			
				if(parseInt(datediff) <= 0){
					datediffvalue = "Expired";
					is_expired_com = 1;
				}
				let createdate = new Date(element.created_at);
				exam_completed_list_com[counter]['appeared_on'] = createdate;
				exam_completed_list_com[counter]['submitted_on'] = element.updated_at;
				exam_completed_list_com[counter]['subject_group_name'] = "-";
				exam_completed_list_com[counter]['assessment_available'] = datediffvalue;
				exam_completed_list_com[counter]['is_expired'] = is_expired_com;
				exam_completed_list_com[counter]['status'] = 1;
				exam_completed_list_com[counter]['exam_unique_id'] = element.exam_unique_id;
				exam_completed_list_com[counter]['exam_unique_id'] = element.exam_unique_id;
				exam_completed_list_com[counter]['createddatetimestamp'] = new Date(element.updated_at).getTime();
				counter++;
				is_expired_com = 0;
    })
}
		/*if(req.body.exam_category_id == 1)
		{
			res.json(await exam_completed.examcompletedlist_scholastic(req.body));
		}
		else if(req.body.exam_category_id == 2)
		{
			res.json(await exam_completed.examcompletedlist_competitive(req.body));
		}*/
		let finaldata_obj = [];

		if(category_id == 1){
			exam_completed_list_com = {};
		}
		else if(category_id == 2){
			exam_completed_list_sch = {};
		}
		assessment_ary = { ...exam_completed_list_sch, ...exam_completed_list_com };

		for (const [key, value] of Object.entries(assessment_ary)) {
			finaldata_obj.push(value);
		  }
		  finaldata_obj.sort((a, b) => b.createddatetimestamp - a.createddatetimestamp);

		  finaldata_obj.sort(function(a, b) {
			return b.createddatetimestamp - a.createddatetimestamp;
		  });


		res.status(200).send({status:200,msg:"Online Exam Assessment records",data:finaldata_obj})
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Store online exam answers for intermediate
router.post('/interm_storeonlineexamanswers',adminMiddleware.validateToken,  async function(req,res,next){
    try{
		let questionsary = [];
		const student_id = req.body.student_id;
		let total_attempts = 1;
		let last_question_visit = req.body.last_visited_ques_no;
		const exam_category_id = req.body.exam_category_id;
		const exam_time = req.body.exam_time;
		let board_id = req.user.board;
		let examunique_id = req.body.exam_unique_id;
		let subject_group_id = req.body.group_subject_id;
		let exam_type = 0;
		let case_study_exam = 2;
		if(exam_category_id != 1){
			await db.query("select * from exam_type where type_name = '"+req.body.exam_type+"'")
			.then(result=>{
				exam_type = result[0].id;
			})
		}else{
			exam_type = req.body.exam_type;
		}
		 // 1 = Set,2 = module,3= Mock /// For competitive 1 = NTSE,2 = NSTSE	
		let branch = req.body.branch; // For Competititve pass exam sub type value
		if(branch == '')
		{
			branch = 0;
		}
		
		const chapter = req.body.chapter;
		let chapter_code = 0;
		if(exam_category_id == 1)
		{
				let finalno = chapter.match(/\d+/g);
				if(chapter !='CH0'){
					chapter_code = "CH"+(finalno[1]);
				}
		}
		let exam_set_counter = req.body.set_no;
		if(typeof exam_set_counter[0] == "string" && exam_set_counter[0].length > 1 && exam_set_counter[0].slice(0,2) == 'cs')
    	{
			exam_set_counter[0] = exam_set_counter[0].slice(2,3);
			case_study_exam = 1;
		}
		const subject_id = req.body.subject_id;
		const examdata = req.body.examdata;
		let examdata_filter = [];
		examdata.forEach(element=>{
		if(element.is_answered == 1 || element.is_visited == 1)	
			examdata_filter.push(element);
		})
		//console.log(examdata_filter);return;
		let ts = new Date(Date.now());
		let date_ob = new Date(ts);
				let date = date_ob.getDate();
				let month = date_ob.getMonth() + 1;
				let year = date_ob.getFullYear();
				let hours = date_ob.getHours();
				let mins = date_ob.getMinutes();
				let sec = date_ob.getSeconds();
				// prints date & time in YYYY-MM-DD format
		let current_date = (year + "-" + month + "-" + date+" "+hours+":"+mins+":"+sec);

		let resultdata_count = "";
		let questiondata = [];
		await db.query("select * from `interm_storeexamdata` where `interm_storeexamdata`.`case_study_exam` = "+case_study_exam+" and `student_id` = "+student_id+" and `exam_category_id` = "+exam_category_id+" and `subject_id` = "+subject_id+" and `chapter` = '"+chapter_code+"' and `exam_type` = "+exam_type +" and `board_id` = "+board_id+" and `branch` = '"+branch+"' and `set_no` ="+exam_set_counter[0]+" and subject_group_id = "+subject_group_id)
		.then(result=>{
			if(result.length > 0)
			{
				resultdata_count = result.length;
				questiondata = JSON.parse(decodeURI(result[0].examdata));
			}
		})
		if(questiondata.length > 0)
		{
				questiondata.forEach(element=>{
					examdata_filter.forEach(element_inner=>{
						let question_id = element_inner.question_id;

					if(question_id == element.id){
						
						element['is_answered'] = element_inner.is_answered;
						element['is_answered_data'] = element_inner.is_answered_data;
						element['is_corrected'] = element_inner.is_corrected;
						element['is_visited'] = element_inner.is_visited;
						element['last_visited_ques_no'] = element_inner.last_visited_ques_no;
					}
					})
				})
		}else{
			questiondata = examdata;
		}
		//console.log(questiondata);
		//return;
		let query_data = "";
		if(resultdata_count > 0)
		{
			query_data = 'UPDATE `interm_storeexamdata` SET `exam_unique_id` = "'+examunique_id+'", `exam_time` = '+exam_time+',`updated_at`="'+current_date+'",`last_visited_ques_no` ='+last_question_visit+',`examdata` = "'+encodeURI(JSON.stringify(questiondata))+'"  \
			WHERE `student_id` = '+student_id+' and `exam_category_id` = '+exam_category_id+' and `subject_id` = '+subject_id+' \
			and `chapter` = "'+chapter_code+'" and `board_id` = '+board_id+' and `exam_type` = '+exam_type+' and `branch` = "'+branch+'" and `set_no` ='+exam_set_counter[0]+" and `subject_group_id` = "+subject_group_id;
		}else
		{
			query_data = 'INSERT INTO `interm_storeexamdata`(`student_id`,`exam_unique_id`, `exam_category_id`, `total_attempts`, `exam_time`, `exam_type`,`board_id`,`branch`, `chapter`, `set_no`,`subject_group_id`, `subject_id`, `examdata`,`case_study_exam`,`created_at`,`updated_at`) \
			VALUES ("'+student_id+'","'+examunique_id+'","'+exam_category_id+'",'+total_attempts+',"'+exam_time+'","'+exam_type+'",'+board_id+',"'+branch+'","'+chapter_code+'","'+exam_set_counter[0]+'","'+subject_group_id+'","'+subject_id+'","'+encodeURI(JSON.stringify(questiondata))+'","'+case_study_exam+'","'+current_date+'","'+current_date+'")';
		}
		console.log("Call Interm");
		await db.query(query_data)
			.then((result)=>{
				res.status(200).send({
					"status": 200,
					"msg": "Online exam interm question answers saved",
					student_id:student_id,
				})

		});


	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get scholastic exam details for casestudy
router.post('/getscholasticexamsdetails_casestudy',adminMiddleware.validateToken, async function(req,res,next){
	try{
		let userdata = req.user;
		const student_id = req.user.id;
		const board = req.user.board;
		const classid = req.user.class;
		const subject_id = req.body.subject_id;
		const chapter_id = req.body.chapter_no;
		let interm_exam_exist = 0;
		let exam_data = "";
		let filter_casestudy_ids = 0;
		let filter_casestudy_idsary = [];
		await db.query("select * from `online_exam_question_answers_casestudy` where `student_id` = "+student_id+" and `subject_id` = "+subject_id+" group by `case_study_group_id`")
		 .then(async result=>{
			if(result.length > 0)
			{
				result.forEach(element=>{
					filter_casestudy_idsary.push(element.case_study_group_id);
				})
			}
		 })
		 
	
		 if(filter_casestudy_idsary!=''){
		 	filter_casestudy_ids = filter_casestudy_idsary.join(",");
		 }
		
		 await db.query("select * from `questions` where `question_type` = 'CSS' and `status` = 1 and `demo_exam` = 0 and `is_approve` = 1 and `is_deleted` = 0 and `class` = "+classid+" and `branch_id` = "+subject_id+" and `exam_type_id` = "+board+" and `chapter_id` = "+chapter_id+" and !FIND_IN_SET(css_group_id,"+filter_casestudy_ids+") group by css_group_id order by rand() limit 0,2")
		 .then(async result=>{
			if(result.length > 0)
			{
				const myPromise = new Promise((resolve, reject) => {
					let cssgroupid = [];
				result.forEach(element=>{
					cssgroupid.push("'"+element.css_group_id+"'");
				})
				resolve(cssgroupid);
			});
			myPromise.then(async (cssgroupid)=>{
				await db.query("select * from `questions` where `question_type` = 'CSS' and css_group_id IN ("+cssgroupid+")")
				.then(async final_result=>{
						res.json(await questions.casestudyquestoion_set(final_result,userdata));
				})
			});
				
			

			}else{
				let response = {status: config.successStatus, msg: "No case study exam data found",exam_duration:0, data:[]};
				res.json(response);
			}
		 })
		 

	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Store case study online exam answers against student
router.post('/storeonlineexamanswers_casestudy',adminMiddleware.validateToken, async function(req,res,next){
    try{
		let questionsary = [];
		const student_id = req.user.id;
	
		let student_name = "";
		let student_mobile = "";
		await db.query("select * from `students` where id = "+student_id)
		.then(result=>{
			student_name = result[0].fname+" "+result[0].lname;		
			student_mobile = result[0].mobile;
		})
		
		req.body.examdata.forEach(element => {
			if(element.guest_post_ans_status == undefined || element.guest_post_ans_status =='')
					{
						element.guest_post_ans_status = 0;
					}
			
			db.query("INSERT INTO `online_exam_question_answers_casestudy`(`student_id`, `case_study_group_id`, `question_id`,\
			 `question_no`, `post_ans`, `post_ans_status`) VALUES ("+student_id+",'"+element.case_study_group_id+"','"+element.question_id+"',\
			 '"+element.question_no+"','"+element.guest_post_ans+"','"+element.guest_post_ans_status+"')")
		  });
		
				res.status(200).send({
					"status": 200,
					"msg": "Online exam question answers saved",
					student_id:result,
					exam_id:exam_unique_id
				})

				/////////////////SEND SMS //////////////
				let smsbody = config.assessmentsheetready.body.replace("#field1#",student_name);
				let smsdata = {phonenumber:student_mobile,body:encodeURI(smsbody)}
				helper.sendsms(smsdata);
			////////////////////////////////////////////
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get Exam details by exam unique id
router.post('/getexamdetails_byexamno',adminMiddleware.validateToken,  async function(req,res,next){
    try{
		let exam_unique_id = req.body.exam_unique_id;
		let total_attempts_count = 0;
		
		await db.query("select * from `interm_storeexamdata` where `exam_unique_id` = '"+exam_unique_id+"'")
		.then(result=>{
			total_attempts_count = result[0].total_attempts;
		})

		res.status(200).send({
			"status": 200,
			"msg": "Interm exam details",
			total_attempts_count:total_attempts_count,
			exam_id:exam_unique_id
		})

		
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
})
//////////////////////////////////// Academic Session Start //////////
// Check academic session exist or not against board/type and category
router.post('/check_academic_session_exist',adminMiddleware.validateToken,  async function(req,res,next){
	try{
		res.json(await academic_session.check_academic_session_exist(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
		next(err);
	}
})

/////////////////////////////////// Academic Session End /////////////
// Get archived group subject list against a particular student using student ID 
router.post('/getpurchased_grouplist_archive',adminMiddleware.validateToken, async function(req,res,next){
	try{
		let class_no = req.body.class;
		let request_data = {student_id:req.user.id,exam_category_id:1,class_no:class_no};
		res.json(await purchased_subscribtion_details.get_group_subjectlists_archive(request_data));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
module.exports = router;