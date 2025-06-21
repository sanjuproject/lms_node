const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const exam_scholastic = require('../services/exam_scholastic_subscribtion_master.js');
const exam_competitive = require('../services/exam_competitive_subscribtion_master.js');
const addtocart_subscription = require('../services/addtocart_subscription.js');
const purchased_subscribtions = require('../services/purchased_subscribtions.js');
const purchased_subscribtions_details = require('../services/purchase_subscribtion_details.js');
const exam_completed = require('../services/exam_completed.js');
const helper = require('../helper.js');
const { config } = require('dotenv');
const configdata  = require('../config.js');
const db = require('../services/db.js');
const chapters = require('../services/chapters.js');
const performance_service = require('../services/performance_service.js');
const purchased_subscribtion_details = require('../services/purchase_subscribtion_details.js');

router.post('/getexamscholasticperformance',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let examconfigaration_ary = [];
		let overalavg = 0;
		await db.query("select exam_set_configuration.*,`students`.`id` as `student_id` from `exam_set_configuration` left join `students` on `students`.`board` = `exam_set_configuration`.`board_id`\
		 where `exam_set_configuration`.`type` = 1 and `exam_set_configuration`.`exam_category_id` = 1 and`students`.`id` = "+req.body.student_id)
		.then(result=>{
			result.forEach(element=>{
				examconfigaration_ary = JSON.parse(element.configuration_details);
			})
		})
		let hotvalue = 0;
		if(examconfigaration_ary.HOT > 0)
		{
			hotvalue = examconfigaration_ary.HOT;
		}
		else if(examconfigaration_ary.HOTS > 0)
		{
			hotvalue = examconfigaration_ary.HOTS;
		}
		let total_questons = examconfigaration_ary.SWA + hotvalue + examconfigaration_ary.DES;
	
		let question_parttern_ary = [];
		await db.query("select * from `question_pattern` where `exam_category_id` = 1 and `is_deleted` = 0 and `status` = 1")
		.then(result=>{
			result.forEach(element=>{
				question_parttern_ary[element.short_code] = element.marks;
			})
		})

		let interm_finalary = []
		let finalary = {}
		let avg_cal_total = [];
		await db.query("select * from `exam_performance_scholastic` where `student_id` = "+req.body.student_id+" and `subject_id` = "+req.body.subject_id)
		.then(result=>{
			result.forEach(Element=>{
				Element.question_type_swa_marks = Element.question_type_swa * question_parttern_ary['SWA'];
				Element.question_type_hot_marks = Element.question_type_hot * question_parttern_ary['HOT'];
				Element.question_type_des_marks = Element.question_type_des * question_parttern_ary['DES'];

				Element.question_type_total = Element.question_type_swa + Element.question_type_hot + Element.question_type_des;
				Element.question_type_total_marks = Element.question_type_swa_marks + Element.question_type_hot_marks + Element.question_type_des_marks;
				
				Element.set_average = Math.ceil((Element.question_type_total/total_questons)*100)

				interm_finalary.push(Element)
			})
		})
	let i =0;
	let j = 0;
	let total_chap = 0;
	let total_avg_cal = 0;
		interm_finalary.forEach(element=>{
			if(finalary[element['chapter']] == null){
				finalary[element['chapter']]=[];
				total_avg_cal = 0;
				total_chap++;
			}
			finalary[element['chapter']].push(element);
			total_avg_cal += element['set_average'];
			if(i == 0)
			{
				j = 1;
			}else{
				j = i;
			}
			let total_avg = Math.ceil(total_avg_cal/(j));
		
			avg_cal_total[element['chapter']] = total_avg;
			finalary[element['chapter']][0]['total_avg'] = total_avg;
			i++;
		})
		for (const key in avg_cal_total) {

			if (avg_cal_total.hasOwnProperty(key)) {
				overalavg += avg_cal_total[key];
				//console.log(`${key}: ${avg_cal_total[key]}`);
			}
		}
		res.send({status:200,data:finalary,overallavg: Math.ceil(overalavg/(total_chap))});
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
/////////////// Page 1 Box 2 AND PAGE 2 BOX 1///////////////////////////
router.post('/getscholasticstrengthanalysis',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let board = req.user.board;
		let student_id = req.user.id;
		let group_subject_id = req.body.group_subject_id;
		let subjectary = [];
		let subjectary_module = [];
		let subjectary_mock = [];
		let subjectnameary = [];
		let subjectnameary_module = [];
		let subjectnameary_mock = [];
		let overalavg = 0;
		let finalary = {};
		let total_question_css_group = 5;
		let group_subjects = "";
		await db.query("select exam_completed.*,subjects.name as subject_name from exam_completed left join subjects on subjects.id = exam_completed.subject_id where exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+" group by exam_completed.subject_id")
		.then(result=>{
			result.forEach(element=>{	
					subjectary.push(element['subject_id']);
					subjectnameary.push(element['subject_name']);
			
			})
		})

		await db.query("select exam_completed.*,subjects.name as subject_name from exam_completed left join subjects on subjects.id = exam_completed.subject_id where exam_type = 2 and student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+" group by exam_completed.subject_id")
		.then(result=>{
			result.forEach(element=>{	
					subjectary_module.push(element['subject_id']);
					subjectnameary_module.push(element['subject_name']);
			
			})
		})

		await db.query("select exam_completed.*,subjects.name as subject_name from exam_completed left join subjects on subjects.id = exam_completed.subject_id where exam_type = 3 and student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+" group by exam_completed.subject_id")
		.then(result=>{
			result.forEach(element=>{	
					subjectary_mock.push(element['subject_id']);
					subjectnameary_mock.push(element['subject_name']);
			
			})
		})
	
//////////////////////////////////// Question Parteen Master ///////////////////////////
let question_pattern_ary = [];
await db.query("select * from `question_pattern` where `status` = 1 and `is_deleted` = 0")
.then(result=>{
	result.forEach(element=>{
		question_pattern_ary[element['short_code']] = element['marks'];
		if(element['short_code'] == 'CSS')//Check Case study or not
				{
					//question_pattern_ary[element['short_code']] = (element['marks']/total_question_css_group);
				}
	})
})


/////////////////////// SET EXAM Performance ///////////////////////////////
let right_marks_subject_ary = {};
let total_marks_subject_ary = {};

let right_marks = 0;
let total_marks = 0;

		await db.query("select online_exam_question_answers.post_ans_status,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id,question_pattern.marks from `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type where `exam_category_id` = 1 and exam_completed.exam_type = 1 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+"")
		.then(result=>{
			result.forEach(element=>{	
				if(element['post_ans_status'] == 1){
					if(right_marks_subject_ary[element['subject_id']] == null){
						right_marks_subject_ary[element['subject_id']] = [];
						right_marks_subject_ary[element['subject_id']].push(element['marks']);
					}else{
						right_marks_subject_ary[element['subject_id']].push(element['marks']);
					}
					right_marks += element['marks'];
				}
				total_marks += element['marks'];
				if(total_marks_subject_ary[element['subject_id']] == null){
					total_marks_subject_ary[element['subject_id']]=[];				
						total_marks_subject_ary[element['subject_id']].push(element['marks']);
	
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						total_marks_subject_ary[element['subject_id']].push(element['marks']);
					}
				}
			})
		})
		finalary.label = subjectnameary;
		finalary.labels = [];
		finalary.labels.push(subjectnameary);
		finalary.labels.push(subjectnameary);
		finalary.labels.push(subjectnameary);
		finalary.series = [];
//////////////// Calculate Average against Subjects SET ///////////////////////////
let marks_avg_ary = [];
let set_subject_marks = [];
let exist_record = 0;
	if(Object.keys(total_marks_subject_ary).length > 0){
		subjectary.forEach(k=>{
			var sum = 0;
			var sum2 = 0; 
			let avg_value = 0;
			if(total_marks_subject_ary[k] != undefined){
				//sum = total_marks_subject_ary[k].length;
				sum = total_marks_subject_ary[k].reduce(function (x, y) {
					return x + y;
				}, 0);
			}
			if(Object.keys(right_marks_subject_ary).length > 0){
				if(right_marks_subject_ary[k] != undefined){
				//sum2 = right_marks_subject_ary[k].length;	
				sum2 = right_marks_subject_ary[k].reduce(function (x, y) {
					return x + y;
				}, 0);
		}
		}
		if(sum2 > 0){
		 	avg_value = ((sum2/sum)*100);
		}
			marks_avg_ary.push(avg_value);
			set_subject_marks.push(avg_value.toFixed(2));
			exist_record++;
			
		});
		}

		let i = 0;
		subjectnameary.forEach(element=>{
			if(exist_record <= i){
			marks_avg_ary.push(0);
			}
			i++;
		})

		let marks_sum = marks_avg_ary.reduce(function (x, y) {
				return parseFloat(x) + parseFloat(y);
				}, 0);
		let set_overallavg = (marks_sum/marks_avg_ary.length).toFixed(2);

		finalary.series.push({"name":"Ch Test","data":set_subject_marks,"overall":set_overallavg});
		
/////////////////////// MODULE EXAM Performance ///////////////////////////////
let module_right_marks_subject_ary = {};
let module_total_marks_subject_ary = {};

let module_right_marks = 0;
let module_total_marks = 0;
let total_module_subject = 0;
		await db.query("select online_exam_question_answers.post_ans_status,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed` left join online_exam_question_answers on \
		online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on \
		questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and \
		exam_completed.exam_type = 2 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+"")
		.then(result=>{
			result.forEach(element=>{	
				if(element['post_ans_status'] == 1){
					if(module_right_marks_subject_ary[element['subject_id']] == null){
						module_right_marks_subject_ary[element['subject_id']] = [];
						module_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}else{
						module_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
					//right_marks += question_pattern_ary[element['question_type']];
				}
				//total_marks += question_pattern_ary[element['question_type']];
				if(module_total_marks_subject_ary[element['subject_id']] == null){
					module_total_marks_subject_ary[element['subject_id']]=[];				
					module_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
	
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						module_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
				}
			})
		})
		total_module_subject = Object.keys(module_total_marks_subject_ary).length;
	
		//////////////// Calculate Average against Subjects MODULE ///////////////////////////
		let module_marks_avg_ary = [];
		let module_subject_marks = [];
		exist_record = 0;
		if(Object.keys(module_total_marks_subject_ary).length > 0)
		{
			subjectary.forEach(k=>{
		
			var sum = 0;
			var sum2 = 0;
			let avg_value = 0;
			if(module_total_marks_subject_ary[k] != undefined){
				//sum = module_total_marks_subject_ary[k].length;
				sum = module_total_marks_subject_ary[k].reduce(function (x, y) {
				return x + y;
				}, 0);

			
			if(Object.keys(module_right_marks_subject_ary).length > 0){
				if(module_right_marks_subject_ary[k] != undefined){
					//sum2 = module_right_marks_subject_ary[k].length;
					sum2 = module_right_marks_subject_ary[k].reduce(function (x, y) {
					return x + y;
					}, 0);
				}
			}
			if(sum2 > 0){
				//console.log(sum2,"=====",sum);
				avg_value = ((sum2/sum)*100);
			}
			module_marks_avg_ary.push(avg_value);
			module_subject_marks.push(avg_value.toFixed(2));
			exist_record++;
		}else{
			module_subject_marks.push("0.00");
		}
		});
	}
	 i = 0;
		subjectnameary_module.forEach(element=>{
			if(exist_record <= i){
				module_marks_avg_ary.push(0);
			}
			i++;
		})
		let module_marks_sum = module_marks_avg_ary.reduce(function (x, y) {
			return parseFloat(x) + parseFloat(y);
			}, 0);
		let module_overallavg = (module_marks_sum/total_module_subject).toFixed(2);

		finalary.series.push({"name":"Module","data":module_subject_marks,"overall":module_overallavg});
		/////////////////////// MOCK EXAM Performance ///////////////////////////////
let mock_right_marks_subject_ary = {};
let mock_total_marks_subject_ary = {};

let mock_right_marks = 0;
let mock_total_marks = 0;
let total_mock_subject = 0;
		await db.query("select online_exam_question_answers.post_ans_status,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed` left join online_exam_question_answers on \
		online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on \
		questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and \
		exam_completed.exam_type = 3 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+"")
		.then(result=>{
			result.forEach(element=>{	
				if(element['post_ans_status'] == 1){
					if(mock_right_marks_subject_ary[element['subject_id']] == null){
						mock_right_marks_subject_ary[element['subject_id']] = [];
						mock_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}else{
						mock_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
					//right_marks += question_pattern_ary[element['question_type']];
				}
				//total_marks += question_pattern_ary[element['question_type']];
				if(mock_total_marks_subject_ary[element['subject_id']] == null){
					mock_total_marks_subject_ary[element['subject_id']]=[];				
					mock_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
	
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						mock_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
				}
			})
		})
		total_mock_subject = Object.keys(mock_total_marks_subject_ary).length;
		//////////////// Calculate Average against Subjects MOCK ///////////////////////////
		let mock_marks_avg_ary = [];
		let mocks_subject_marks = [];
		exist_record = 0;

		if(Object.keys(mock_total_marks_subject_ary).length > 0)
		{
			subjectary.forEach(k=>{
				var sum = 0;
				let avg_value = 0;
				var sum2 = 0;
				if(mock_total_marks_subject_ary[k] != undefined){
					//sum = mock_total_marks_subject_ary[k].length;
					sum = mock_total_marks_subject_ary[k].reduce(function (x, y) {
					return x + y;
					}, 0);
			
				
				if(Object.keys(mock_right_marks_subject_ary).length > 0)
				{
					if(mock_right_marks_subject_ary[k] != undefined){
					//sum2 = mock_right_marks_subject_ary[k].length;
						sum2 = mock_right_marks_subject_ary[k].reduce(function (x, y) {
						return x + y;
						}, 0);
				}
			}
			if(sum2 > 0){
				avg_value = ((sum2/sum)*100);
			}
				mock_marks_avg_ary.push(avg_value);
				mocks_subject_marks.push(avg_value.toFixed(2));
				exist_record++;
				}else{
					mocks_subject_marks.push("0.00");
				}
		})		
	}
	

		i = 0;
		subjectnameary_mock.forEach(element=>{
			if(exist_record <= i){
				mock_marks_avg_ary.push(0);
			}
			i++;
		})

		let modck_marks_sum = mock_marks_avg_ary.reduce(function (x, y) {
			return parseFloat(x) + parseFloat(y);
			}, 0);
		let mock_overallavg = (modck_marks_sum/mock_marks_avg_ary.length).toFixed(2);
	

		finalary.series.push({"name":"Mock","data":mocks_subject_marks,"overall":mock_overallavg});
		//finalary.series[1]['data'] = module_marks_avg_ary;
		
		res.send({status:200,data:finalary});
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

//////////////////////////////// PAGE No 1 BOX 1 ///////////////////////////////////////////////
router.post('/getscholasticoverallperformance',adminMiddleware.validateToken , async function(req,res,next){
    try{
			
		let board = req.user.board;
		let student_id = req.user.id;
		let subject_group_id = req.body.group_subject_id;
		let subjectary = [];
		let subjectnameary = [];
		let overalavg = 0;
		let finalary = {};
		let group_subjects = "";
		let total_question_css_group = 5;
		let right_marks_subject_ary = {};
		let total_marks_subject_ary = {};
	if(student_id != undefined && student_id > 0){	
//////////////////////////////////// Question Parteen Master ///////////////////////////
let question_pattern_ary = [];
await db.query("select * from `question_pattern` where `status` = 1 and `is_deleted` = 0")
.then(result=>{
	result.forEach(element=>{
		question_pattern_ary[element['short_code']] = element['marks'];
		if(element['short_code'] == 'CSS')//Check Case study or not
				{
					//question_pattern_ary[element['short_code']] = (element['marks']/total_question_css_group);
				}
	})
})


/////////////////////// SET EXAM Performance ///////////////////////////////

		await db.query("select online_exam_question_answers.post_ans_status,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and exam_completed.exam_type = 1 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+subject_group_id)
		.then(result=>{
			result.forEach(element=>{	
				if(element['post_ans_status'] == 1){
					if(right_marks_subject_ary[element['subject_id']] == null){
						right_marks_subject_ary[element['subject_id']] = [];
						right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}else{
						right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
				}
				
				if(total_marks_subject_ary[element['subject_id']] == null){
					total_marks_subject_ary[element['subject_id']]=[];				
						total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
	
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
				}
			})
		})

//////////////// Calculate Average against Subjects SET ///////////////////////////
let marks_avg_set = 0;
if(Object.keys(total_marks_subject_ary).length > 0){
    var sum = 0;
	var sum2 = 0;
	for (var k in total_marks_subject_ary){
		
		for(let i= 0;i< total_marks_subject_ary[k].length;i++){
			if(total_marks_subject_ary[k][i] !=undefined){
				sum += total_marks_subject_ary[k][i];
			}
		}
		
		if(right_marks_subject_ary != '')
		{
		if(Object.keys(right_marks_subject_ary).length > 0){
		
			if(right_marks_subject_ary[k] != undefined){
			sum2 += right_marks_subject_ary[k].reduce(function (x, y) {
				return x + y;
			}, 0);
		}
		}
		}
	}

	marks_avg_set = (((sum2/sum)*100)).toFixed(2);
}
/////////////////////// MODULE EXAM Performance ///////////////////////////////
let module_right_marks_subject_ary = {};
let module_total_marks_subject_ary = {};


		await db.query("select online_exam_question_answers.post_ans_status,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and exam_completed.exam_type = 2 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+subject_group_id)
		.then(result=>{
			result.forEach(element=>{	
				if(element['post_ans_status'] == 1){
					if(module_right_marks_subject_ary[element['subject_id']] == null){
						module_right_marks_subject_ary[element['subject_id']] = [];
						module_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}else{
						module_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
					//right_marks += question_pattern_ary[element['question_type']];
				}
				//total_marks += question_pattern_ary[element['question_type']];
				if(module_total_marks_subject_ary[element['subject_id']] == null){
					module_total_marks_subject_ary[element['subject_id']]=[];				
					module_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
	
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						module_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
				}
			})
		})

		//////////////// Calculate Average against Subjects MODULE ///////////////////////////
		let module_marks_avg = 0;
	if(Object.keys(module_total_marks_subject_ary).length > 0)
	{	
		for (var k in module_total_marks_subject_ary){
			if(module_total_marks_subject_ary[k] != undefined){
			var sum = module_total_marks_subject_ary[k].reduce(function (x, y) {
				return x + y;
			}, 0);
		}
			var sum2 = 0;
			
			if(Object.keys(module_right_marks_subject_ary).length > 0)
			{
				if(module_right_marks_subject_ary[k] != undefined){
				sum2 = module_right_marks_subject_ary[k].reduce(function (x, y) {
					return x + y;
				}, 0);
			}
		}
			module_marks_avg = (((sum2/sum)*100)).toFixed(2);
	
		}
	}
		/////////////////////// MOCK EXAM Performance ///////////////////////////////
let mock_right_marks_subject_ary = {};
let mock_total_marks_subject_ary = {};


		await db.query("select online_exam_question_answers.post_ans_status,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and exam_completed.exam_type = 3 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+subject_group_id)
		.then(result=>{
			result.forEach(element=>{	
				if(element['post_ans_status'] == 1){
					if(mock_right_marks_subject_ary[element['subject_id']] == null){
						mock_right_marks_subject_ary[element['subject_id']] = [];
						mock_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}else{
						mock_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
					//right_marks += question_pattern_ary[element['question_type']];
				}
				//total_marks += question_pattern_ary[element['question_type']];
				if(mock_total_marks_subject_ary[element['subject_id']] == null){
					mock_total_marks_subject_ary[element['subject_id']]=[];				
					mock_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
	
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						mock_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
				}
			})
		})

		//////////////// Calculate Average against Subjects MOCK ///////////////////////////
		let mock_marks = 0;
		let mock_total = 0;
		let mock_marks_avg = 0;
	if(Object.keys(mock_total_marks_subject_ary).length > 0)
	{
		var sum = 0;
		for (var k in mock_total_marks_subject_ary){
			var sum = mock_total_marks_subject_ary[k].reduce(function (x, y) {
				return x + y;
			}, 0);
			var sum2 = 0;
			if(Object.keys(mock_right_marks_subject_ary).length > 0)
			{
				if(mock_right_marks_subject_ary[k] != undefined){
				sum2 = mock_right_marks_subject_ary[k].reduce(function (x, y) {
					return x + y;
				}, 0);
				}
			}
			mock_marks += sum2;
			mock_total += sum;
		}
		mock_marks_avg = ((mock_marks/mock_total)*100).toFixed(2);
	}
	
		let avg = {label:"Average Score",set:marks_avg_set,module:module_marks_avg,mock:mock_marks_avg,total:''}
		let set_weightage = (marks_avg_set * 0.1);
		let module_weightage = (module_marks_avg * 0.2);
		let mock_weightage = (mock_marks_avg * 0.7);

		let total_weightage = 0;
		if(module_weightage == 0 && mock_weightage == 0){
			total_weightage = parseFloat((set_weightage * 100)/10).toFixed(2);
		}
		else if(mock_weightage == 0){
			total_weightage = parseFloat(((module_weightage + set_weightage) * 100)/30).toFixed(2);
		}
		else{
			total_weightage = ((parseFloat(set_weightage) + parseFloat(module_weightage) + parseFloat(mock_weightage))).toFixed(2);	
		}
		let weightage = {label:"Weighted Average Score",set:parseFloat(set_weightage).toFixed(2),module:parseFloat(module_weightage).toFixed(2),mock:parseFloat(mock_weightage).toFixed(2),total:parseFloat(total_weightage).toFixed(2)}
		////////////////////////////////////////////////////////////////////////////////////////////////////
			res.send({status:200,data:[avg,weightage]});
	}
	else{
		res.send({status:410,msg:"Internet Error.Off line.Try Again."});
	}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});


router.post('/getscholasticaverageperformance_set_module_mock',adminMiddleware.validateToken , async function(req,res,next){
    try{

		let subjectary = [];
		await db.query("select * from `subjects` where `status` = 1 and is_deleted = 0")
		.then(result=>{
			result.forEach(element=>{
		
				subjectary[element['id']] = element['name'];
			})
		})

		let examconfigaration_ary = [];
		let overalavg = 0;
		await db.query("select exam_set_configuration.*,`students`.`id` as `student_id` from `exam_set_configuration` left join `students` on `students`.`board` = `exam_set_configuration`.`board_id`\
		 where `exam_set_configuration`.`type` = 1 and `exam_set_configuration`.`exam_category_id` = 1 and`students`.`id` = "+req.body.student_id)
		.then(result=>{
			result.forEach(element=>{
				examconfigaration_ary = JSON.parse(element.configuration_details);
			})
		})
		let hotvalue = 0;
		if(examconfigaration_ary.HOT > 0)
		{
			hotvalue = examconfigaration_ary.HOT;
		}
		else if(examconfigaration_ary.HOTS > 0)
		{
			hotvalue = examconfigaration_ary.HOTS;
		}
		let total_questons = examconfigaration_ary.SWA + hotvalue + examconfigaration_ary.DES;
	
		let question_parttern_ary = [];
		await db.query("select * from `question_pattern` where `exam_category_id` = 1 and `is_deleted` = 0 and `status` = 1")
		.then(result=>{
			result.forEach(element=>{
				question_parttern_ary[element.short_code] = element.marks;
			})
		})

		let module_ans_questoionsary = [];
		await db.query("select * from `exam_completed` left join `online_exam_question_answers` on `online_exam_question_answers`.`exam_unique_id` = `exam_completed`.`exam_unique_id`\
		 where `exam_completed`.`exam_type` = 2")
		.then(result=>{
			result.forEach(element=>{
				module_ans_questoionsary[element.short_code] = element.marks;
			})
		})
/////////////////////////////////////////////////////////////////////// SET SECTION ////////////////////////////////////////////////
		let interm_finalary = {}
		let finalary = []
		finalary = []
		await db.query("select exam_performance_scholastic.*,subjects.name as subject_name from `exam_performance_scholastic` left join subjects on subjects.id = exam_performance_scholastic.subject_id where `student_id` = "+req.body.student_id)
		.then(result=>{
			result.forEach(Element=>{
				Element.question_type_total = Element.question_type_swa + Element.question_type_hot + Element.question_type_des;

				if(interm_finalary[Element['subject_id']] == null){
					interm_finalary[Element['subject_id']]=[];
					interm_finalary[Element['subject_id']].push(Element.question_type_total)
				}else{
					interm_finalary[Element['subject_id']].push(Element.question_type_total)
				}
			})
		})
///////////////////////////////////////////////// SET SECTION END //////////////////////////////////////////////////////

//////////////////////////////////////////// MODULE SECTION ////////////////////////////////////////////////////////

let interm_finalary_module = {}
let total_correct_ans_module = 0;
let total_ans_module = 0;
await db.query("select online_exam_question_answers.*,questions.branch,subjects.id as subject_id from online_exam_question_answers\
 left join exam_completed on exam_completed.exam_unique_id = online_exam_question_answers.exam_unique_id left join\
 questions on questions.question_no = online_exam_question_answers.question_no left join\
  branches on branches.branch_code = questions.branch left join subjects on subjects.id = branches.subject_id\
   where `online_exam_question_answers`.`student_id` = "+req.body.student_id+" and `exam_completed`.`exam_type` = 2")

.then(result=>{
   result.forEach(Element=>{
	total_ans_module++;
	   if(Element.post_ans_status == 1)
	   {
		total_correct_ans_module++;
		   if(interm_finalary_module[Element['subject_id']] == null){
			interm_finalary_module[Element['subject_id']]=[];
			interm_finalary_module[Element['subject_id']].push({total_correct_ans:total_correct_ans_module,total_questons:total_ans_module});
		   }
		   else{
			interm_finalary_module[Element['subject_id']].push({total_correct_ans:total_correct_ans_module,total_questons:total_ans_module});
		   }
		   
	   }
	   
   })
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////// MOCK SECTION ////////////////////////////////////////////////////////

let interm_finalary_mock = {}
let total_correct_ans_mock = 0;
let total_ans_mock = 0;
await db.query("select online_exam_question_answers.*,questions.branch,subjects.id as subject_id from online_exam_question_answers\
 left join exam_completed on exam_completed.exam_unique_id = online_exam_question_answers.exam_unique_id left join\
 questions on questions.question_no = online_exam_question_answers.question_no left join\
  branches on branches.branch_code = questions.branch left join subjects on subjects.id = branches.subject_id\
   where `online_exam_question_answers`.`student_id` = "+req.body.student_id+" and `exam_completed`.`exam_type` = 3")

.then(result=>{
   result.forEach(Element=>{
	total_ans_mock++;
	   if(Element.post_ans_status == 1)
	   {
		total_correct_ans_mock++;
		   if(interm_finalary_mock[Element['subject_id']] == null){
			interm_finalary_mock[Element['subject_id']]=[];
			interm_finalary_mock[Element['subject_id']].push({total_correct_ans:total_correct_ans_mock,total_questons:total_ans_mock});
		   }
		   else{
			interm_finalary_mock[Element['subject_id']].push({total_correct_ans:total_correct_ans_mock,total_questons:total_ans_mock});
		   }
	   }
   })
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

//console.log(interm_finalary_module)
		for (const key in interm_finalary){
			if (interm_finalary.hasOwnProperty(key)){
				let total_record = interm_finalary[key].length;
				let total_correct_ans_model = 0;
				let total_ans_model = 0;
				let module_avg = 0;

				let total_correct_ans_mock = 0;
				let total_ans_mock = 0;
				let mock_avg = 0;

				if(interm_finalary_module[key]){
					let interm_finalary_module_record_count = interm_finalary_module[key].length;
					total_ans_model = interm_finalary_module[key][interm_finalary_module_record_count - 1].total_questons;
					total_correct_ans_model = interm_finalary_module[key][interm_finalary_module_record_count - 1].total_correct_ans;
					module_avg = ((total_correct_ans_model/total_ans_model)*100)
				}
				if(interm_finalary_mock[key]){
					let interm_finalary_mock_record_count = interm_finalary_mock[key].length;
					total_ans_mock = interm_finalary_mock[key][interm_finalary_mock_record_count - 1].total_questons;
					total_correct_ans_mock = interm_finalary_mock[key][interm_finalary_mock_record_count - 1].total_correct_ans;
					mock_avg = ((total_correct_ans_mock/total_ans_mock)*100)
				}
				finalary.push({"subject_id":key,"subject_name":subjectary[key],
				"set_avg":((interm_finalary[key].reduce((partialSum, a) => partialSum + a, 0)/(total_record * total_questons))*100).toFixed(2),
			"module_avg":module_avg.toFixed(2),"mock_avg":mock_avg.toFixed(2)});
			}
		}
	
	//let count_subject = 0;
	//let total_value = 0;

		/*for (const key in finalary){
			if (finalary.hasOwnProperty(key)){
				total_value += parseInt(finalary[key]['avg']);
				count_subject++;
			}
		}*/
		res.send({status:200,data:finalary});
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

///////////////////// PAGE NO 3 BOX ALL ////////////////////////////////////////
router.post('/scholastic_getsubjectwise_chapters',adminMiddleware.validateToken , async function(req,res,next){
    try{
		
		let finalary = [];
		let student_id = req.user.id;
		let standard = req.user.class;
		let group_subject_id = req.body.group_subject_id;
		let board = req.user.board;
		let exam_type = req.body.exam_type;
		let subject_chapter_ary = {};
		let subject_color_ary = {};
		let i = 0;
		let searchdata = {};
		searchdata.exam_category_id = 1;
		searchdata.student_id = student_id;
		let chaptersdata_ary = {};
		let chapter_ary_all = {};
		let performance_overall_subject = [];
		let performance_overall_score = [];
		let total_question_css_group = 5;
	if(exam_type != undefined)
	{	
		await performance_service.scholastic_getsubjectwise_chapters_service(req)
		.then(result=>{
			result.label.forEach(element=>{
				performance_overall_subject.push(element);
				//performance_overall_score = result.series[0].data;
			})
			result.series.forEach(element1=>{
				element1.data.forEach(element_inner=>{
					performance_overall_score.push(element_inner);
				})
			})
			//console.log(result);
		})


		await db.query("select subjects.name as subject_name,subjects.subject_color_code from `subjects` where `exam_category_id` = 1 and  `board_id` ="+ board)
		.then(result=>{
			if(result.length > 0)
			{
				result.forEach(element=>{
					if(subject_color_ary[element.subject_name] == null){
						subject_color_ary[element.subject_name] = {};
						}
					subject_color_ary[element.subject_name] = (element.subject_color_code);
				});
			}
		});
		await db.query("select chapters.*,subjects.name as subject_name,subjects.subject_color_code from `chapters` left join subjects on subjects.id = chapters.branch_id where `chapters`.`exam_category_id` = 1 and `chapters`.`standard` = "+standard+" and `chapters`.`board_id` ="+ board)
		.then(result=>{
			if(result.length > 0)
			{
				result.forEach(element=>{
					if(subject_chapter_ary[element.subject_name] == null){
					subject_chapter_ary[element.subject_name] = {};
					//subject_color_ary[element.subject_name] = {};
					}
					
					if(subject_chapter_ary[element.subject_name]['labels'] == null){
						subject_chapter_ary[element.subject_name]['labels'] = [];
					}
					subject_chapter_ary[element.subject_name]['labels'].push(element.chapter_no);
					//subject_color_ary[element.subject_name] = (element.subject_color_code);
					if(subject_chapter_ary[element.subject_name]['datasets'] == null){
						subject_chapter_ary[element.subject_name]['datasets'] = {};
					}
					if(subject_chapter_ary[element.subject_name]['datasets']['data'] == null){
						subject_chapter_ary[element.subject_name]['datasets']['data'] = [];
					}
				})
			}
		})
		
		let questions_partten_ary = [];
		await db.query("select * from `question_pattern` where `is_deleted` = 0 and `status` = 1")
		.then(result=>{
			if(result.length >0)
			{
				result.forEach(element=>{
					questions_partten_ary[element.short_code] = element.marks;
					if(element.short_code == 'CSS')//Check Case study or not
					{
						//questions_partten_ary[element.short_code] = (element.marks/total_question_css_group);
					}
				})
			}
		});
		
		let correct_subject_chapter_ary = {};
		let details_chapter_exam_ary_interm = {};
		let add_info_subject = {};
		let add_info_chapter = {};
		let details_chapter_exam_ary_interm_incorrent_ans = {};
		let details_chapter_exam_ary = {};
		let final_result_ary = {};
	
let chapter_ary = {};
		await db.query("select exam_completed.*,subjects.name as subject_name,chapters.chapter_no,online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,online_exam_question_answers.question_id,questions.question_type from `exam_completed` left join `online_exam_question_answers` on `exam_completed`.`exam_unique_id` = `online_exam_question_answers`.`exam_unique_id` left join subjects on subjects.id = exam_completed.subject_id left join chapters on chapters.id = exam_completed.chapter_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_completed`.`exam_type` = "+exam_type+" and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`chapter_id` != 0 and chapters.standard = "+standard+" and exam_completed.subject_group_id = "+group_subject_id+" GROUP by exam_completed.chapter_id order by chapters.chapter_no asc")
		.then(result=>{
			if(result.length > 0)
			{
				result.forEach(element=>{
					if(chapter_ary[element.subject_name] == null){
						chapter_ary[element.subject_name] = [];
					}
					chapter_ary[element.subject_name].push(element.chapter_id);
				})
			}
		});
		
		await db.query("select exam_completed.*,subjects.name as subject_name,chapters.chapter_no,online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,online_exam_question_answers.question_id,questions.question_type from `exam_completed` left join `online_exam_question_answers` on `exam_completed`.`exam_unique_id` = `online_exam_question_answers`.`exam_unique_id` left join subjects on subjects.id = exam_completed.subject_id left join chapters on chapters.id = exam_completed.chapter_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_completed`.`exam_type` = "+exam_type+" and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`chapter_id` != 0 and exam_completed.subject_group_id = "+group_subject_id+" GROUP by exam_completed.subject_id order by chapters.chapter_no asc")
		.then(async result=>{
			if(result.length > 0)
			{
				let subjectary = [];
				let studentdata = [];
			studentdata.board = board;
			studentdata.class = standard;
			let already_searched_subjects = [];
			
			await result.forEach(async element=>{
				let subject_id = element.subject_id;
				let subjects_id = subject_id;
				let category_id = 0;
				if(chapter_ary_all[element.subject_name] == null)
				{
					chapter_ary_all[element.subject_name] = [];
				}
				
				await db.query("select * from `subjects` where `id` = "+subject_id+" and is_deleted = 0 and status = 1")
				.then(result=>{
				if(result[0].group_exist == 1){
				subjects_id = (result[0].group_subjects);
				category_id = result[0].exam_category_id;
				}else if(result[0].group_exist == 2){
				category_id = result[0].exam_category_id;
				}
				})
				let where_data = "";
				if(category_id == 1){
					where_data = " and chapters.exam_category_id = 1 and chapters.board_id = "+board +" and chapters.standard = "+standard+" order by chapters.order_no ASC";
				}else{
					where_data = " and chapters.exam_category_id = 2 order by chapters.order_no ASC";
				}
				
				await db.query("select chapters.*,subjects.subject_image,subjects.elibrary_image,subjects.subject_code as branch,subjects.name as branch_name,subjects.subject_color_code from `chapters` left join subjects on chapters.branch_id = subjects.id where chapters.is_deleted = 0 and chapters.status = 1 and  `branch_id` IN ("+subjects_id+") "+where_data)
				   .then(result_chapter=>{
					let counter_value = 1;
					
					 result_chapter.forEach(element_chapter=>{
						
						if(chapter_ary_all[element.subject_name][element_chapter.id] == null)
						{
							chapter_ary_all[element.subject_name][element_chapter.id] = [];
						}
						chapter_ary_all[element.subject_name][element_chapter.id].push(counter_value);
						counter_value++;
						//console.log("LOOP",chapter_ary_all)
						
					})
				})
			});
		}
		
	});
let set_no = 0;
	setTimeout(async () => {
		let query_data = "";
		if(exam_type == 1){
		query_data = "select exam_completed.*,subjects.name as subject_name,chapters.chapter_no,online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,online_exam_question_answers.question_id,questions.question_type from `exam_completed` left join `online_exam_question_answers` on `exam_completed`.`exam_unique_id` = `online_exam_question_answers`.`exam_unique_id` left join subjects on subjects.id = exam_completed.subject_id left join chapters on chapters.id = exam_completed.chapter_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_completed`.`exam_type` = "+exam_type+" and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`chapter_id` != 0 and exam_completed.subject_group_id = "+group_subject_id+" order by chapters.chapter_no+0 asc";
		}
		else
		{
			query_data = "select exam_completed.*,subjects.name as subject_name,chapters.chapter_no,online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,online_exam_question_answers.question_id,questions.question_type from `exam_completed` left join `online_exam_question_answers` on `exam_completed`.`exam_unique_id` = `online_exam_question_answers`.`exam_unique_id` left join subjects on subjects.id = exam_completed.subject_id left join chapters on chapters.id = exam_completed.chapter_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_completed`.`exam_type` = "+exam_type+" and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`chapter_id` != 0 and exam_completed.subject_group_id = "+group_subject_id+" order by exam_completed.exam_set_counter asc";
		}
		await db.query(query_data)
		.then(async result=>{
			if(result.length > 0)
			{
				//console.log(chapter_ary_all);
				let previous_chapter_id = parseInt(result[0].chapter_id);
				let previous_subject = parseInt(result[0].subject_name);
				let chapter_counter = 1;

				let subjectary = [];
				let studentdata = [];
			studentdata.board = board;
			studentdata.class = standard;
			let already_searched_subjects = [];
			
			await result.forEach(async element=>{
				
				subjectary.subject_id = element.subject_id;
	
	
					if(correct_subject_chapter_ary[element.subject_name] == null){
						correct_subject_chapter_ary[element.subject_name] = {};
						add_info_subject[element.subject_name] = {};
						add_info_chapter[element.subject_name] = {};
					}

					let current_chapter_id = parseInt(element.chapter_id);

					//console.log(chapter_ary_all[element.subject_name][element.chapter_id],element.id,element.chapter_id);
					
					let current_subject = (element.subject_name);
					let chapter_name = "";
					if(exam_type == 1){
					let indexofvalue = chapter_ary_all[element.subject_name][element.chapter_id];
					chapter_name = ("CH"+ indexofvalue).toString();
					}else{
					let indexofvalue = parseInt(chapter_ary[element.subject_name].indexOf(element.chapter_id)) + 1;
					chapter_name = ("CH"+ indexofvalue).toString();
					}
				if(chapter_name !='CHundefined')
				{	
					element.chapter_no = chapter_name;
					if(exam_type == 2 || exam_type == 3)
					{
						element.chapter_no = "CH"+element.exam_set_counter;
					}
					//element.chapter_no = chapter_name;
					
					if(correct_subject_chapter_ary[element.subject_name][element.chapter_no] == null){
						correct_subject_chapter_ary[element.subject_name][element.chapter_no] = [];
					}
					if(details_chapter_exam_ary_interm[element.subject_name] == null){
						details_chapter_exam_ary_interm[element.subject_name] = {};
						details_chapter_exam_ary[element.subject_name] = {};
						details_chapter_exam_ary_interm_incorrent_ans[element.subject_name] = {};
						
						add_info_chapter[element.subject_name][element.chapter_no] = {};
					}
					add_info_subject[element.subject_name] = element.subject_id;
					add_info_chapter[element.subject_name][element.chapter_no] = parseInt(element.chapter_id);

					if(details_chapter_exam_ary_interm[element.subject_name][element.chapter_no] == null){
						details_chapter_exam_ary_interm[element.subject_name][element.chapter_no] = [];
						details_chapter_exam_ary[element.subject_name][element.chapter_no] = [];
						details_chapter_exam_ary_interm_incorrent_ans[element.subject_name][element.chapter_no] = [];
					}
					details_chapter_exam_ary_interm[element.subject_name][element.chapter_no].push(element); 
					if(element.post_ans_status == 1){
						correct_subject_chapter_ary[element.subject_name][element.chapter_no].push(questions_partten_ary[element.question_type]);
					}
					
					if(element.post_ans_status == 0 && element.post_ans != 'undefined' && element.post_ans != ''){
			
						details_chapter_exam_ary_interm_incorrent_ans[element.subject_name][element.chapter_no].push(questions_partten_ary[element.question_type]);
					}
					
					if((previous_chapter_id != current_chapter_id) && (previous_subject == current_subject)){
						previous_chapter_id = current_chapter_id;
						chapter_counter++;
					}
					if((previous_subject != current_subject))
					{
						previous_subject = current_subject;
						chapter_counter = 1;
					}
				}
				})
		}
	})
//console.log(details_chapter_exam_ary_interm);
//return
	
//////////////////////////////////// Question Parteen Master ///////////////////////////
let question_pattern_ary = [];
await db.query("select * from `question_pattern` where `status` = 1 and `is_deleted` = 0")
.then(result=>{
	result.forEach(element=>{
		question_pattern_ary[element['short_code']] = element['marks'];
	})
})
	/////////////////////// MODULE EXAM Performance ///////////////////////////////
let module_right_marks_subject_ary = {};
let module_total_marks_subject_ary = {};
let mock_total_marks_subject_ary = {};
let mock_right_marks_subject_ary = {};
let module_right_marks = 0;
let module_total_marks_ary = [];

		await db.query("select online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and exam_completed.exam_type = 2 and exam_completed.chapter_id != 0 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+"")
		.then(result=>{
			result.forEach(element=>{	
				if(module_total_marks_subject_ary[element['subject_id']] == null){
					module_total_marks_subject_ary[element['subject_id']]=[];				
					module_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						module_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
						
						
					}
				}
			})
		})
/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////// MOCK SECTION //////////////////////////
		await db.query("select online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and exam_completed.exam_type = 3 and exam_completed.chapter_id != 0 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+"")
		.then(result=>{
			result.forEach(element=>{	
				if(mock_total_marks_subject_ary[element['subject_id']] == null){
					mock_total_marks_subject_ary[element['subject_id']]=[];				
					mock_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						mock_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
				}
			})
		})

	
	let module_mock_counter = 1;
	let subject_counter = 0;
	for (const key in details_chapter_exam_ary_interm) {
		let percentage = 0;
		let subject_total_marks = 0;
		let subject_correct_marks = 0;
		let total_chapter = 0;
		let first_chapter = "";
		//console.log(details_chapter_exam_ary_interm['History and Civics']);return;
		for (const key2 in details_chapter_exam_ary_interm[key])
		{
			if(first_chapter == "")
			{
				first_chapter = key2;
			}
	
			
			let current_subject_data = await db.query("select * from `subjects` where name = '"+key+"' and exam_category_id = 1 and board_id = "+board);
			let subject_id = current_subject_data[0].id;
			let class_id = req.user.class_id;
			
		
			//let current_chapter_data = await db.query("select * from `chapters` where branch_id = "+subject_id+" and chapter_no = '"+key2+"' and standard = "+class_id);
			let chapter_id = 0;
			let total_set_no = 1;
			
			
			{
				chapter_id = add_info_chapter[key][key2];
			
			//console.log("select * from `exam_completed` where `student_id` = "+student_id+" and exam_type = 1 and subject_id = "+subject_id+" and chapter_id = "+chapter_id);
			let set_counter = await db.query("select * from `exam_completed` where `student_id` = "+student_id+" and exam_type = 1 and subject_id = "+subject_id+" and chapter_id = "+chapter_id+" and exam_completed.subject_group_id = "+group_subject_id+"");
				total_set_no = set_counter.length;
			}
			let total_exam_marks = 20 * total_set_no;
			if(exam_type == 2){
			//total_exam_marks = module_total_marks_subject_ary[details_chapter_exam_ary_interm[key][key2][0].subject_id].reduce((a, b) => a + b, 0);
			total_exam_marks = 40;
			}
			else if(exam_type == 3){
				//total_exam_marks = mock_total_marks_subject_ary[details_chapter_exam_ary_interm[key][key2][0].subject_id].reduce((a, b) => a + b, 0);
				total_exam_marks = 80;
			}
			let total_question = details_chapter_exam_ary_interm[key][key2].length;
			if(total_question > 14 && exam_type == 1){
				total_exam_marks = 20 * 2;
			}
			let total_incorrect_ans = details_chapter_exam_ary_interm_incorrent_ans[key][key2].length;
			let total_correct_ans = correct_subject_chapter_ary[key][key2].length;

			if(final_result_ary[key] == null){
				final_result_ary[key] = {};
			}
			
			if(final_result_ary[key][key2] == null){
				final_result_ary[key][key2] = [];
			}
			let sum = 0;
				// calculate sum using forEach() method
				correct_subject_chapter_ary[key][key2].forEach( num => {
				sum += num;
				})
				
			let total_marks = sum; // Correct Marks
			
			
			
			let chapter_correct_percentage = 0;
			
			if(total_marks > 0){
				
				chapter_correct_percentage = ((parseInt(total_marks)/parseInt(total_exam_marks))* 100);
				subject_correct_marks += parseInt(total_marks);
			}
			subject_total_marks +=  parseInt(total_exam_marks);
			
			//percentage += chapter_correct_percentage;

			final_result_ary[key][key2].push((chapter_correct_percentage).toFixed(2), (add_info_chapter[key][key2]),
			add_info_subject[key]);
			let total_attended = total_incorrect_ans + total_correct_ans;
			//Calculate Total Marks
				
			let total_not_attempted = total_question - total_attended;
			details_chapter_exam_ary[key][key2] = {total_question:total_question,total_incorrect_ans:total_incorrect_ans,
				total_correct_ans:total_correct_ans,total_attended:total_attended,total_not_attempted:total_not_attempted,
				total_marks:total_marks}
				total_chapter++;
				
		}	
		let subject_index = performance_overall_subject.indexOf(key);
		//console.log(subject_correct_marks,subject_total_marks);return;
		//final_result_ary[key][first_chapter].push(performance_overall_score[subject_index]); // NEW CODE 
		let subject_overall = ((subject_correct_marks/subject_total_marks)*100).toFixed(2);
		let performance_overall_score_value = performance_overall_score[subject_index];
		if(subject_overall == performance_overall_score_value){
		final_result_ary[key][first_chapter].push(subject_overall);// OLD CODE
		}else{
			final_result_ary[key][first_chapter].push(performance_overall_score_value);
		}
		final_result_ary[key][first_chapter].push(subject_color_ary[key]);
		subject_counter++;
	}

	//console.log(final_result_ary);
	let final_result_ary_mod_mock = {};
	let details_chapter_exam_ary_mod_mock = {}; 
	if(exam_type == 2)
	{
		for (const key in final_result_ary) {
			if(final_result_ary_mod_mock[key] == null){
				final_result_ary_mod_mock[key] = {};
			}
			let i = 1;
			for (const key2 in final_result_ary[key]) {
				if(final_result_ary_mod_mock[key]['MOD'+i] == null){
					final_result_ary_mod_mock[key]['MOD'+i] = [];
				}
				let obj = final_result_ary[key];
				let sorted = Object.keys(obj).sort().reduce((accumulator, key) => {accumulator[key] = obj[key];
					return accumulator; }, {});
				
					
				final_result_ary_mod_mock[key]['MOD'+i] = sorted[key2];
				i++;
			}
		}

		for (const key in details_chapter_exam_ary) {
			if(details_chapter_exam_ary_mod_mock[key] == null){
				details_chapter_exam_ary_mod_mock[key] = {};
			}
			let i = 1;
			for (const key2 in details_chapter_exam_ary[key]) {
				if(details_chapter_exam_ary_mod_mock[key]['MOD'+i] == null){
					details_chapter_exam_ary_mod_mock[key]['MOD'+i] = [];
				}
				let obj = details_chapter_exam_ary[key];
				let sorted = Object.keys(obj)
  .sort()
  .reduce((accumulator, key) => {
    accumulator[key] = obj[key];

    return accumulator;
  }, {});
				details_chapter_exam_ary_mod_mock[key]['MOD'+i] = details_chapter_exam_ary[key][key2];
				i++;
			}
		}
	} 
	else if(exam_type == 3)
	{
		for (const key in final_result_ary) {
			if(final_result_ary_mod_mock[key] == null){
				final_result_ary_mod_mock[key] = {};
			}
			let i = 1;
			for (const key2 in final_result_ary[key]) {
				if(final_result_ary_mod_mock[key]['MOCK'+i] == null){
					final_result_ary_mod_mock[key]['MOCK'+i] = [];
				}
				final_result_ary_mod_mock[key]['MOCK'+i] = final_result_ary[key][key2];
				i++;
			}
		}

		for (const key in details_chapter_exam_ary) {
			if(details_chapter_exam_ary_mod_mock[key] == null){
				details_chapter_exam_ary_mod_mock[key] = {};
			}
			let i = 1;
			for (const key2 in details_chapter_exam_ary[key]) {
				if(details_chapter_exam_ary_mod_mock[key]['MOCK'+i] == null){
					details_chapter_exam_ary_mod_mock[key]['MOCK'+i] = [];
				}
				details_chapter_exam_ary_mod_mock[key]['MOCK'+i] = details_chapter_exam_ary[key][key2];
				i++;
			}
		}
	}
	
	let data = {};
	if(exam_type == 1)
	{
	data['piechart'] = final_result_ary;
	data['tabledata'] = details_chapter_exam_ary;
	}else{
		data['piechart'] = final_result_ary_mod_mock;
	data['tabledata'] = details_chapter_exam_ary_mod_mock;
	}
		res.send({status:200,data:data});
	},1000);
}else{
	res.send({status:400,msg:"Internet Error.Off line.Try Again.",data:{}});
}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});


///////////////////// Scholastic PAGE NO 4 BOX ALL ////////////////////////////////////////
router.post('/scholastic_getchapterwise_analysis',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let finalary = [];
		let student_id = req.user.id;
		let standard = req.user.class;
		let group_subject_id = req.body.group_subject_id;
		let board = req.user.board;
		let subject = req.body.subject;
		let chapter = req.body.chapter;
		let exam_type = req.body.exam_type;
		let total_question_css_group = 5;
	
	if(subject !=undefined && chapter !=undefined && exam_type !=undefined)
	{	
		let questions_partten_ary = [];
		await db.query("select * from `question_pattern` where `is_deleted` = 0 and `status` = 1")
		.then(result=>{
			if(result.length >0)
			{
				result.forEach(element=>{
					questions_partten_ary[element.short_code] = element.marks;
					if(element.short_code == 'CSS')//Check Case study or not
				{
					//questions_partten_ary[element.short_code] = (element.marks/total_question_css_group);
				}
				})
			}
		});
		
		let correct_subject_chapter_ary = {};
		let details_chapter_exam_ary_interm = {};
		let details_chapter_exam_ary_interm_incorrent_ans = {};
		let details_chapter_exam_ary = {};
		let table_result_ary_interm = {};
		let table_result_ary = {};
		//console.log((subject_chapter_ary))
		let query = "";
		if(exam_type == 1){
			query = "select exam_completed.*,subjects.name as subject_name,chapters.chapter_no,chapters.chapter_name,chapters.sub_heading as chapter_heading,chapters.order_no,online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,online_exam_question_answers.question_id,questions.question_type from `exam_completed` left join `online_exam_question_answers` on `exam_completed`.`exam_unique_id` = `online_exam_question_answers`.`exam_unique_id` left join subjects on subjects.id = exam_completed.branch_id left join chapters on chapters.id = exam_completed.chapter_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_completed`.`exam_type` = "+exam_type+" and `exam_completed`.`subject_id` = "+subject+" and `exam_completed`.`chapter_id` = "+chapter+" and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`subject_group_id` = "+group_subject_id+" and questions.question_type !='CSS'";

		}else if(exam_type > 1){
			query = "select exam_completed.*,subjects.name as subject_name,chapters.chapter_no,chapters.chapter_name,chapters.sub_heading as chapter_heading,chapters.order_no,online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,online_exam_question_answers.question_id,questions.question_type from `exam_completed` left join `online_exam_question_answers` on `exam_completed`.`exam_unique_id` = `online_exam_question_answers`.`exam_unique_id` left join subjects on subjects.id = exam_completed.subject_id left join chapters on chapters.id = exam_completed.chapter_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_completed`.`exam_type` = "+exam_type+" and `exam_completed`.`subject_id` = "+subject+" and `exam_completed`.`chapter_id` = "+chapter+" and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`subject_group_id` = "+group_subject_id;
		}

		await db.query(query)
		.then(result=>{
			if(result.length > 0)
			{
				let exam_set_counter_ary = [];
				
			
					result.forEach(element=>{
						
						if(exam_type == 2){
							element.set_counter = element.exam_set_counter;
							element.exam_set_counter = 1;
						}
						else if(exam_type == 3){
							element.set_counter = element.exam_set_counter;
							element.exam_set_counter = 1;
						}
						if(element.case_study_exam == 1)
						{
							element.exam_set_counter = 3;
						}
						
						//element.exam_set_counter = parseInt(key) + 1;
						if(correct_subject_chapter_ary[element.exam_set_counter] == null){
							correct_subject_chapter_ary[element.exam_set_counter] = [];
							table_result_ary[element.exam_set_counter] = {};
							table_result_ary_interm[element.exam_set_counter] = {};
						}
						if(table_result_ary[element.exam_set_counter]['SWA'] == null){
							table_result_ary[element.exam_set_counter]['SWA'] = [];
							table_result_ary_interm[element.exam_set_counter]['SWA'] = [];
						}
						if(table_result_ary[element.exam_set_counter]['DES'] == null){
							table_result_ary[element.exam_set_counter]['DES'] = [];
							table_result_ary_interm[element.exam_set_counter]['DES'] = [];
						}
						if(table_result_ary[element.exam_set_counter]['HOT'] == null){
							table_result_ary[element.exam_set_counter]['HOT'] = [];
							table_result_ary_interm[element.exam_set_counter]['HOT'] = [];
						}
						if(exam_type > 1)
						{
							if(table_result_ary[element.exam_set_counter]['CSS'] == null){
								table_result_ary[element.exam_set_counter]['CSS'] = [];
								table_result_ary_interm[element.exam_set_counter]['CSS'] = [];
							}
						}

						if(details_chapter_exam_ary_interm[element.exam_set_counter] == null){
							details_chapter_exam_ary_interm[element.exam_set_counter] = [];
							details_chapter_exam_ary[element.exam_set_counter] = [];
							details_chapter_exam_ary_interm_incorrent_ans[element.exam_set_counter] = [];
						}

						details_chapter_exam_ary_interm[element.exam_set_counter].push(element); 

						if(element.post_ans_status == 1){

							correct_subject_chapter_ary[element.exam_set_counter].push(questions_partten_ary[element.question_type]);
							table_result_ary_interm[element.exam_set_counter][element.question_type].push(questions_partten_ary[element.question_type]);
						}
						if(element.post_ans_status == 0 && element.post_ans !='undefined'){
							details_chapter_exam_ary_interm_incorrent_ans[element.exam_set_counter].push(questions_partten_ary[element.question_type]);
						}
						
					})
		}
	})

	for (const key in details_chapter_exam_ary_interm) {
		
			let total_question = details_chapter_exam_ary_interm[key].length;
			let total_incorrect_ans = details_chapter_exam_ary_interm_incorrent_ans[key].length;
			let total_correct_ans = correct_subject_chapter_ary[key].length;
		
			let total_attended = total_incorrect_ans + total_correct_ans;
			let total_not_attempted = total_question - total_attended;
			let chapter_heading = details_chapter_exam_ary_interm[key][0].chapter_heading;
			let chapter_name = "Chapter "+details_chapter_exam_ary_interm[key][0].order_no;
			if(exam_type == 2){
				let str = details_chapter_exam_ary_interm[key][0].set_counter;
				chapter_heading = "Module "+str;
				chapter_name = details_chapter_exam_ary_interm[key][0].subject_name;
			}
			else if(exam_type == 3){
				let str = details_chapter_exam_ary_interm[key][0].set_counter;
				chapter_heading = "Mock "+str;
				chapter_name = details_chapter_exam_ary_interm[key][0].subject_name;
			}
			details_chapter_exam_ary[key] = {total_question:total_question,total_incorrect_ans:total_incorrect_ans,
				total_correct_ans:total_correct_ans,total_attended:total_attended,total_not_attempted:total_not_attempted,
			chapter_name:chapter_name,chapter_heading:chapter_heading,chapter_test:key}
	
			
	}

	for (const key in table_result_ary_interm) {
		
		let total_set_record = 0;
		let total_set_marks = 0;
		for (const key2 in table_result_ary_interm[key]) {
			let total_correct = 0;
			let total_marks = 0;
				total_correct = table_result_ary_interm[key][key2].length;
				total_marks = table_result_ary_interm[key][key2].reduce((a, b) => a + b, 0);
			
			total_set_record += total_correct;
			total_set_marks += total_marks;
			
			table_result_ary[key][key2] = {"total_correct":total_correct,"total_marks":total_marks};
			table_result_ary[key]['total'] = {"total_correct":total_set_record,"total_marks":total_set_marks};
			
		}
	}
	
	let data = {};
	data['piechart'] = details_chapter_exam_ary;
	data['tabledata'] = table_result_ary;

	//console.log(data)
		res.send({status:200,data:data});
}else{
	res.send({status:400,msg:"Internet Error.Off line.Try Again.",data:{}});
}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});



router.post('/scholastic_getchapterwise_analysis_case_study',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let finalary = [];
		let student_id = req.user.id;
		let standard = req.user.class;
		let group_subject_id = req.body.group_subject_id;
		let board = req.user.board;
		let subject = req.body.subject;
		let chapter = req.body.chapter;
		let exam_type = req.body.exam_type;
		let total_question_css_group = 5;
		let subject_name = "";
	if(subject !=undefined && chapter !=undefined && exam_type !=undefined)
	{	
		let questions_partten_ary = [];
		await db.query("select * from `question_pattern` where `is_deleted` = 0 and `status` = 1")
		.then(result=>{
			if(result.length >0)
			{
				result.forEach(element=>{
					questions_partten_ary[element.short_code] = element.marks;
					if(element.short_code == 'CSS')//Check Case study or not
				{
					//questions_partten_ary[element.short_code] = (element.marks/total_question_css_group);
				}
				})
			}
		});
		
		let correct_subject_chapter_ary = {};
		let details_chapter_exam_ary_interm = {};
		let details_chapter_exam_ary_interm_incorrent_ans = {};
		let details_chapter_exam_ary = {};
		let table_result_ary_interm = {};
		let table_result_ary = {};
		
		//console.log((subject_chapter_ary))
		let query = "";
		if(exam_type == 1){
			query = "select exam_completed.*,subjects.name as subject_name,chapters.chapter_no,chapters.chapter_name,chapters.sub_heading as chapter_heading,chapters.order_no,online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,online_exam_question_answers.question_id,questions.question_type from `exam_completed` left join `online_exam_question_answers` on `exam_completed`.`exam_unique_id` = `online_exam_question_answers`.`exam_unique_id` left join subjects on subjects.id = exam_completed.branch_id left join chapters on chapters.id = exam_completed.chapter_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_completed`.`exam_type` = "+exam_type+" and `exam_completed`.`subject_id` = "+subject+" and `exam_completed`.`chapter_id` = "+chapter+" and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`subject_group_id` = "+group_subject_id+" and questions.question_type ='CSS'";

		}else if(exam_type > 1){
			query = "select exam_completed.*,subjects.name as subject_name,chapters.chapter_no,chapters.chapter_name,chapters.sub_heading as chapter_heading,chapters.order_no,online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,online_exam_question_answers.question_id,questions.question_type from `exam_completed` left join `online_exam_question_answers` on `exam_completed`.`exam_unique_id` = `online_exam_question_answers`.`exam_unique_id` left join subjects on subjects.id = exam_completed.subject_id left join chapters on chapters.id = exam_completed.chapter_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_completed`.`exam_type` = "+exam_type+" and `exam_completed`.`subject_id` = "+subject+" and `exam_completed`.`chapter_id` = "+chapter+" and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`subject_group_id` = "+group_subject_id+" and questions.question_type ='CSS'";
		}

		await db.query(query)
		.then(result=>{
			if(result.length > 0)
			{
				let exam_set_counter_ary = [];
				
			
					result.forEach(element=>{
						
						if(element.case_study_exam == 1)
						{
							element.exam_set_counter = 0;
						}
						
						//element.exam_set_counter = parseInt(key) + 1;
						if(correct_subject_chapter_ary[element.exam_set_counter] == null){
							correct_subject_chapter_ary[element.exam_set_counter] = [];
							table_result_ary[element.exam_set_counter] = {};
							table_result_ary_interm[element.exam_set_counter] = {};
						}
						if(table_result_ary[element.exam_set_counter]['CSS'] == null){
							table_result_ary[element.exam_set_counter]['CSS'] = [];
							table_result_ary_interm[element.exam_set_counter]['CSS'] = [];
						}

						if(details_chapter_exam_ary_interm[element.exam_set_counter] == null){
							details_chapter_exam_ary_interm[element.exam_set_counter] = [];
							details_chapter_exam_ary[element.exam_set_counter] = [];
							details_chapter_exam_ary_interm_incorrent_ans[element.exam_set_counter] = [];
						}

						details_chapter_exam_ary_interm[element.exam_set_counter].push(element); 

						if(element.post_ans_status == 1){

							correct_subject_chapter_ary[element.exam_set_counter].push(questions_partten_ary[element.question_type]);
							table_result_ary_interm[element.exam_set_counter][element.question_type].push(questions_partten_ary[element.question_type]);
						}
						if(element.post_ans_status == 0 && element.post_ans !='undefined'){
							details_chapter_exam_ary_interm_incorrent_ans[element.exam_set_counter].push(questions_partten_ary[element.question_type]);
						}
						
						subject_name = element.subject_name;
					})
		}
	})

	for (const key in details_chapter_exam_ary_interm) {
		
			let total_question = details_chapter_exam_ary_interm[key].length;
			let total_incorrect_ans = details_chapter_exam_ary_interm_incorrent_ans[key].length;
			let total_correct_ans = correct_subject_chapter_ary[key].length;
		
			let total_attended = total_incorrect_ans + total_correct_ans;
			let total_not_attempted = total_question - total_attended;
			let chapter_heading = details_chapter_exam_ary_interm[key][0].chapter_heading;
			let chapter_name = "Chapter "+details_chapter_exam_ary_interm[key][0].order_no;
			if(exam_type == 2){
				let str = details_chapter_exam_ary_interm[key][0].set_counter;
				chapter_heading = "Module "+str;
				chapter_name = details_chapter_exam_ary_interm[key][0].subject_name;
			}
			else if(exam_type == 3){
				let str = details_chapter_exam_ary_interm[key][0].set_counter;
				chapter_heading = "Mock "+str;
				chapter_name = details_chapter_exam_ary_interm[key][0].subject_name;
			}
			details_chapter_exam_ary[key] = {total_question:total_question,total_incorrect_ans:total_incorrect_ans,
				total_correct_ans:total_correct_ans,total_attended:total_attended,total_not_attempted:total_not_attempted,
			chapter_name:chapter_name,chapter_heading:chapter_heading,chapter_test:"Case Study",subject_name:subject_name}
	
			
	}

	for (const key in table_result_ary_interm) {
		
		let total_set_record = 0;
		let total_set_marks = 0;
		for (const key2 in table_result_ary_interm[key]) {
			let total_correct = 0;
			let total_marks = 0;
				total_correct = table_result_ary_interm[key][key2].length;
				total_marks = table_result_ary_interm[key][key2].reduce((a, b) => a + b, 0);
			
			total_set_record += total_correct;
			total_set_marks += total_marks;
			
			table_result_ary[key][key2] = {"total_correct":total_correct,"total_marks":total_marks};
			table_result_ary[key]['total'] = {"total_correct":total_set_record,"total_marks":total_set_marks};
			
		}
	}
	
	let data = {};
	data['piechart'] = details_chapter_exam_ary;
	data['tabledata'] = table_result_ary;

	//console.log(data)
		res.send({status:200,data:data});
}else{
	res.send({status:400,msg:"Internet Error.Off line.Try Again.",data:{}});
}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/////////////////////////// Competititve PAGE 1 BOX 2  //////////////////////////////////////////
router.post('/getcompetitive_subject_avgscore',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let interm_final_ary = [];
		let finalary = [];
		let finaldataary_student = [];
		let finaldataary = [];
		let categories = [];
		let subject_ary = [];
		let total_correct_ans_ary = [];
		let total_record_ary = [];
		let total_student_no = [];
		let total_correct_record_ary = [];
		let exam_type = req.body.exam_type;
		let query_data_ary = [];
		let student_total_record_ary = [];
		let student_total_correct_record_ary = [];
		let user_id = req.user.id;
		let query_data = "";
		let math_subjects = ["AR","AL","GM"];

if(exam_type != undefined && req.body.student_id != undefined)
{
		let allow_setno_for_calculation = 0;
		let allow_exams_for_market_trend_ary = [];
		let allow_exams_for_market_trend_list = "";
		
		let query_data_value = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id where `exam_completed_competitive`.`exam_type` = '"+exam_type+"' and\
		 `exam_completed_competitive`.`student_id` = "+req.body.student_id;

		await db.query(query_data_value)
		.then(result=>{
			result.forEach(Element=>{
				if(Element.exam_type =='NTSE' && Element.exam_subtype_id == 2)
				{
					allow_setno_for_calculation = Element.exam_set_counter;
				}else if(Element.exam_type =='NSTSE'){
					allow_setno_for_calculation = Element.exam_set_counter;
				}
				else{
					allow_setno_for_calculation = Element.exam_set_counter;
				}
			})
		})

		let query_data_value_market_trend = "select exam_completed_competitive.* from `exam_completed_competitive` where `exam_completed_competitive`.`exam_type` = '"+exam_type+"' and `exam_completed_competitive`.`student_id` != "+req.body.student_id;

		await db.query(query_data_value_market_trend)
		.then(result=>{
			result.forEach(Element=>{
				if(Element.exam_type =='NTSE' && Element.exam_subtype_id == 2)
				{
					allow_exams_for_market_trend_ary.push("'"+Element.exam_unique_id+"'");
				}else if(Element.exam_type =='NSTSE'){
					allow_exams_for_market_trend_ary.push("'"+Element.exam_unique_id+"'");
				}
				else{
					allow_exams_for_market_trend_ary.push("'"+Element.exam_unique_id+"'");
				}
			})
		})


if(exam_type !='Competitive')
{
	query_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id join questions on questions.id = online_exam_question_answers_competitive.question_id where exam_completed_competitive.exam_type = '"+exam_type+"' and online_exam_question_answers_competitive.student_id = "+user_id+" GROUP by online_exam_question_answers_competitive.question_id";
}else{
	query_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id join questions on questions.id = online_exam_question_answers_competitive.question_id where online_exam_question_answers_competitive.student_id = "+user_id+" GROUP by online_exam_question_answers_competitive.question_id";
}
		await db.query(query_data)
		.then(result=>{
			query_data_ary = result;
	
		
		query_data_ary.forEach(Element=>{
			if(allow_setno_for_calculation >= Element['exam_set_counter'])
				{
					if(student_total_record_ary[Element['branch']] == null)
					{
						student_total_record_ary[Element['branch']] = [];
						student_total_correct_record_ary[Element['branch']] = [];
					}
					if(Element.post_ans_status == 1){
						student_total_correct_record_ary[Element['branch']].push(Element);	
					}
					student_total_record_ary[Element['branch']].push(Element);
				}
			})
		})

		let query_market_data = "";
	
		if(allow_exams_for_market_trend_ary.length > 0){
			allow_exams_for_market_trend_list = allow_exams_for_market_trend_ary.toString();
			query_market_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id where questions.is_deleted = 0 and questions.is_approve = 1 and questions.demo_exam = 0 and questions.exam_category = 2 and exam_completed_competitive.exam_type = '"+exam_type+"' and exam_completed_competitive.exam_unique_id in ("+allow_exams_for_market_trend_list+")";
		}
		else{
			query_market_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id where questions.is_deleted = 0 and questions.is_approve = 1 and questions.demo_exam = 0 and questions.exam_category = 2 and exam_completed_competitive.exam_type = '"+exam_type+"' and exam_completed_competitive.exam_unique_id in ('')";
		}

			await db.query(query_market_data)
		.then(result=>{
			query_data_ary = result;
			result.forEach(Element=>{
				if(!total_student_no.includes(Element.student_id))
				{
					total_student_no.push(Element.student_id);
				}
				if(total_record_ary[Element['branch']] == null)
				{
					total_record_ary[Element['branch']] = [];
					total_correct_record_ary[Element['branch']] = [];
				}
				if(Element.post_ans_status == 1){
					total_correct_record_ary[Element['branch']].push(Element);	
				}
				total_record_ary[Element['branch']].push(Element);
			})
		})


		await db.query("select * from `subjects` left join  exam_type on  exam_type.id = subjects.exam_type_id where `subjects`.`exam_category_id` = 2 and `subjects`.`is_deleted` = 0 and `subjects`.`status` = 1 and `subjects`.`group_exist` = 2 and  exam_type.type_name = '"+exam_type+"'")
		.then(result=>{
			result.forEach(element=>{
				if(math_subjects.includes(element.subject_code))
				{
					categories.push("Math("+element.subject_code+")");
				}else{
					categories.push(element.name);
				}
				
				subject_ary.push(element.subject_code);
			})
		})

		subject_ary.forEach(element=>{
			let student_correct_avg = 0;
			let market_correct_avg = 0;
			if(student_total_correct_record_ary[element]!=undefined){
			student_correct_avg = ((student_total_correct_record_ary[element].length/student_total_record_ary[element].length)*100).toFixed(2);
			//console.log(element,student_total_correct_record_ary[element].length,student_total_record_ary[element].length)
			if(total_correct_record_ary[element]!=undefined){
				market_correct_avg = (((total_correct_record_ary[element].length/total_record_ary[element].length)*100)).toFixed(2);
			}
			finaldataary_student.push(student_correct_avg);
			finaldataary.push(market_correct_avg);
			}else{
				finaldataary_student.push(student_correct_avg);
				finaldataary.push(market_correct_avg);
			}
		})
		
		
		//finalary.shift();// Removed First Blank elment from array
		
		res.status(200).send({status:200,msg:"Subject Average Score vs Market Trend",data:{series:[{data:finaldataary_student},{data:finaldataary},{data:finaldataary_student}],categories:categories}})
	}else{
		res.status(410).send({status:410,msg:"Internet Error.Off line.Try Again.",data:{}})
	}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});



/////////////////////////// Competititve Set Wise SAT/MAT Score PAGE 2 BOX 1 and 3  //////////////////////////////////////////
router.post('/getcompetitive_setwise_sat_mat_score',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let final_search_ary_interm = {};
		let final_search_ary = {};
		let exam_subtype_id = req.body.exam_subtype;
		let exam_set_counter = req.body.set_no;
		let exam_type = req.body.exam_type;
		let questions_partten_ary = [];
		if(exam_subtype_id != undefined && exam_set_counter != undefined && exam_type != undefined)
		{
		await db.query("select * from `question_pattern` where `is_deleted` = 0 and `status` = 1")
		.then(result=>{
			if(result.length >0)
			{
				result.forEach(element=>{
					questions_partten_ary[element.short_code] = element.marks;
				})
			}
		});
		
		await db.query("select questions.branch,questions.question_type, exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,\
		online_exam_question_answers_competitive.post_ans_status from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id \
		where `exam_completed_competitive`.`exam_type` = '"+exam_type+"' and `exam_completed_competitive`.`exam_subtype_id` = "+exam_subtype_id+" and \
		`exam_completed_competitive`.`exam_set_counter` = "+exam_set_counter+" and `exam_completed_competitive`.`student_id` = "+req.body.student_id)
		.then(result=>{
			result.forEach(Element=>{
				if(final_search_ary_interm['total_record'] == null)
					{
						final_search_ary_interm['total_record'] = [];
						final_search_ary_interm['not_attempted'] = [];
						final_search_ary_interm['correct_record'] = [];
						final_search_ary_interm['incorrect_record'] = [];
					}
					final_search_ary_interm['total_record'].push(Element);
				if(Element.post_ans_status == 1)
				{
					final_search_ary_interm['correct_record'].push(Element);
				}
				if(Element.post_ans_status == 0 && Element.post_ans !='undefined' && Element.post_ans !=''){
					final_search_ary_interm['incorrect_record'].push(Element);
				}
				if(Element.post_ans =='undefined' || Element.post_ans ==''){
					final_search_ary_interm['not_attempted'].push(Element);
				}
			})
		})
		for(const key in final_search_ary_interm){
			final_search_ary[key] = final_search_ary_interm[key].length;
		}

		//console.log(subject_right_marks_ary)
		

		res.status(200).send({status:200,msg:"Set Wise Score Comparison",data:final_search_ary})
	}else{
		res.status(410).send({status:410,msg:"Internet Error.Off line.Try Again.",data:{}})
	}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/////////////////////////// Competititve Set Wise SAT/MAT Score PAGE 2 BOX 2 and 4  //////////////////////////////////////////
router.post('/getcompetitive_setwise_sat_mat_score_subject',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let final_search_ary_interm = {};
		let final_search_ary_table = {};
		let final_search_ary = [];
		let final_search_table = [];
		let final_color_ary = [];
		let exam_subtype_id = req.body.exam_subtype;
		let exam_set_counter = req.body.set_no;
		let exam_type = req.body.exam_type;
		let resultdata = [];
		let questions_partten_ary = [];
		let subject_ary = {};
		let subject_name_ary = {};
		let math_subjects = ["AR","AL","GM"];
		if(exam_subtype_id != undefined && exam_set_counter != undefined && exam_type != undefined)
		{
		await db.query("select * from `question_pattern` where `is_deleted` = 0 and `status` = 1")
		.then(result=>{
			if(result.length >0)
			{
				result.forEach(element=>{
					questions_partten_ary[element.short_code] = element.marks;
				})
			}
		});

		await db.query("select * from `subjects` where `is_deleted` = 0 and `status` = 1 and exam_category_id = 2")
		.then(result=>{
			if(result.length >0)
			{
				result.forEach(element=>{
					if(subject_ary[element.subject_code] == null)
					{
						subject_ary[element.subject_code]= [];
						subject_name_ary[element.subject_code]= [];
					}
					subject_ary[element.subject_code] = element.subject_color_code;
					subject_name_ary[element.subject_code] = element.name;
				})
			}
		});

		await db.query("select questions.branch,questions.question_type, exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,\
		online_exam_question_answers_competitive.post_ans_status from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id \
		where `exam_completed_competitive`.`exam_type` = '"+exam_type+"' and `exam_completed_competitive`.`exam_subtype_id` = "+exam_subtype_id+" and \
		`exam_completed_competitive`.`exam_set_counter` = "+exam_set_counter+" and `exam_completed_competitive`.`student_id` = "+req.body.student_id)
		.then(result=>{
			resultdata = result;
			resultdata.forEach(Element=>{
				if(final_search_ary_interm[Element.branch] == null)
					{
						final_search_ary_interm[Element.branch]= {};
						final_search_ary_table[Element.branch]= {};
					}
					if(final_search_ary_interm[Element.branch]['correct_record'] == null)
					{
						final_search_ary_table[Element.branch]['total_record']= [];
						final_search_ary_interm[Element.branch]['correct_record'] = [];
						final_search_ary_table[Element.branch]['incorrect_record'] = [];
						final_search_ary_table[Element.branch]['correct_record'] = [];
						final_search_ary_table[Element.branch]['attempt_record'] = [];
						final_search_ary_table[Element.branch]['notattempt_record'] = [];
						final_search_ary_table[Element.branch]['score'] = [];
					}
					
					final_search_ary_table[Element.branch]['total_record'].push(Element);
				if(Element.post_ans_status == 1)
				{
					final_search_ary_interm[Element.branch]['correct_record'].push((Element));
					final_search_ary_table[Element.branch]['correct_record'].push((Element));
				}
				if(Element.post_ans_status == 0 && Element.post_ans !='undefined' && Element.post_ans !=''){
					final_search_ary_table[Element.branch]['incorrect_record'].push(Element);
				}
				if(Element.post_ans !='undefined' && Element.post_ans !=''){
					final_search_ary_table[Element.branch]['attempt_record'].push(Element);
				}
				if(Element.post_ans =='undefined' && Element.post_ans_status == 0 && Element.post_ans != ""){
					final_search_ary_table[Element.branch]['notattempt_record'].push(Element);
				}
			})
		})

		//console.log(final_search_ary_table);
		for(const key in final_search_ary_interm){	
			for(const key2 in final_search_ary_interm[key]){
				let subejct_name = key;
				if(math_subjects.includes(key)){
					subejct_name = "Math("+key+")";
				}
				//final_search_ary[key][key2] = final_search_ary_interm[key][key2].length;
				final_search_ary.push({name:subject_name_ary[key],data:[final_search_ary_interm[key][key2].length]});
			}
			final_color_ary.push(subject_ary[key]);
		}

		for(const key in final_search_ary_table){	
				//final_search_ary[key][key2] = final_search_ary_interm[key][key2].length;
				let total_marks = 0;
				final_search_ary_table[key]['correct_record'].forEach(element=>{
					if(element.post_ans_status == 1)
					{
						total_marks += questions_partten_ary[element.question_type];
					}
				})
				final_search_table.push({name:subject_name_ary[key],total_questions:final_search_ary_table[key]['total_record'].length,
				correct_record:final_search_ary_table[key]['correct_record'].length,
				incorrect_record:final_search_ary_table[key]['incorrect_record'].length,
				attempt_record:final_search_ary_table[key]['attempt_record'].length,
				notattempt_record:final_search_ary_table[key]['notattempt_record'].length,
			marks:total_marks});
		}
		//console.log(subject_right_marks_ary)
		res.status(200).send({status:200,msg:"Set Wise Score Comparison",data:{series:[final_search_ary],colors:final_color_ary,table_data:final_search_table}})
	}else{
		res.status(410).send({status:410,msg:"Internet Error.Off line.Try Again.",data:{}})
	}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});



/////////////////////////// Set wise score comparison(NTSE) (page - 1 BOX 4) ////////////////////////////////
router.post('/getcompetitive_setwise_score',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let interm_final_ary = [];
		let finalary = [];
		let finaldataary = [];
		let categories = [];
		let total_correct_ans_ary = [];
		let total_record_ary = [];
		let exam_type = req.body.exam_type;
		let allow_setno_for_calculation = 0;
		if(exam_type != undefined && req.body.student_id != undefined)
		{
		let query_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id join questions on questions.id = online_exam_question_answers_competitive.question_id where `exam_completed_competitive`.`student_id` = "+req.body.student_id+" and `exam_completed_competitive`.`exam_type` = '"+exam_type+"'";

		await db.query(query_data)
		.then(result=>{
			result.forEach(Element=>{
				if(Element.exam_type =='NTSE' && Element.exam_subtype_id == 2)
				{
					allow_setno_for_calculation = Element.exam_set_counter;
				}else if(Element.exam_type =='NSTSE'){
					allow_setno_for_calculation = Element.exam_set_counter;
				}
				else{
					allow_setno_for_calculation = Element.exam_set_counter;
				}
			})
		})
		await db.query(query_data)
		.then(result=>{
			result.forEach(Element=>{
				if(allow_setno_for_calculation >= Element.exam_set_counter)
				{
					if(total_correct_ans_ary[Element['exam_set_counter']] == null)
					{
						total_correct_ans_ary[Element['exam_set_counter']] = [];
					}
	
					total_correct_ans_ary[Element['exam_set_counter']].push(Element);
				}
			})
		})

		
		total_correct_ans_ary.forEach(element=>{
		if(element.length > 0){	
			if(finalary[element[0]['exam_set_counter']] == null)
				{
					finalary[element[0]['exam_set_counter']] = [];
				}
				let set_no = element[0]['exam_set_counter'];
				let total_correct_sat = 0;
				let total_correct_mat = 0;
				let total_question = 0;
				for(let i = 0;i < total_correct_ans_ary[set_no].length;i++)
				{
					
						if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 1 && total_correct_ans_ary[set_no][i]['exam_subtype_id'] == 1)
						{
							total_correct_sat++;
						}
					
						if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 1 && total_correct_ans_ary[set_no][i]['exam_subtype_id'] == 2)
						{
							total_correct_mat++;
						}
						if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 1 && total_correct_ans_ary[set_no][i]['exam_subtype_id'] == 0)
						{
							total_correct_sat++;
						}

						total_question++;
				}
				
				let total_ans = (((total_correct_sat + total_correct_mat)/total_question)*100).toFixed(2);
				
				//finaldataary.push({"set_no":set_no,"total_records":total_ans});
				finaldataary.push(total_ans)
				categories.push("Set"+set_no)
			}
		})
		
		//finalary.shift();// Removed First Blank elment from array
		
		res.status(200).send({status:200,msg:"Set wise score comparison",data:{series:[{data:finaldataary}],categories:categories}})
	}else{
		res.status(410).send({status:410,msg:"Internet Error.Off line.Try Again.",data:{}})
	}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});


/////////////////////////// Competititve PAGE 3 BOX 1  //////////////////////////////////////////
router.post('/getcompetitive_subjectwisecomparison',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let interm_final_ary = [];
		let finalary = [];
		let finaldataary_student = [];
		let finaldataary = [];
		let categories = [];
		let subject_ary = [];
		let total_correct_ans_ary = [];
		let total_record_ary = [];
		let total_correct_record_ary = [];
		let subject_colors = [];
		let exam_type = req.body.exam_type;
		let exam_subtype = req.body.sub_type;
		let exam_subtype_id = 0;
		let set_no = req.body.set_no;
		if(exam_type != undefined && exam_subtype != undefined && set_no != undefined)
		{
		if(exam_subtype == 'SAT')
		{
			exam_subtype_id = 1;
		}
		if(exam_subtype == 'MAT')
		{
			exam_subtype_id = 2;
		}

		let allow_setno_for_calculation = 0;
		
		let query_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id where `exam_completed_competitive`.`exam_type` = '"+exam_type+"' and\
		 `exam_completed_competitive`.`student_id` = "+req.body.student_id;

		await db.query(query_data)
		.then(result=>{
			result.forEach(Element=>{
				if(Element.exam_type == 'NTSE' && Element.exam_subtype_id == 2)
				{
					allow_setno_for_calculation = Element.exam_set_counter;
				}else if(Element.exam_type =='NSTSE'){
					allow_setno_for_calculation = Element.exam_set_counter;
				}
				else{
					allow_setno_for_calculation = Element.exam_set_counter;
				}
			})
		})



		let search_result_ary = [];
		await db.query("select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id left join questions on questions.id = online_exam_question_answers_competitive.question_id where `exam_completed_competitive`.`student_id` = "+req.body.student_id+" and exam_completed_competitive.exam_type = '"+exam_type+"' and exam_completed_competitive.exam_set_counter ="+set_no+" GROUP by online_exam_question_answers_competitive.question_id")
		.then(result=>{
			search_result_ary = result;
			result.forEach(Element=>{
				if(allow_setno_for_calculation >= Element['exam_set_counter'])
				{
					if(total_record_ary[Element['branch']] == null)
					{
						total_record_ary[Element['branch']] = [];
						total_correct_record_ary[Element['branch']] = [];
					}
					if(Element.post_ans_status == 1){
						total_correct_record_ary[Element['branch']].push(Element);	
					}
					total_record_ary[Element['branch']].push(Element);
				}
			})
		})
		let student_total_record_ary = [];
		let student_total_correct_record_ary = [];

		
			search_result_ary.forEach(Element=>{
				if(allow_setno_for_calculation >= Element['exam_set_counter'])
				{
					if(student_total_record_ary[Element['branch']] == null)
					{
						student_total_record_ary[Element['branch']] = [];
						student_total_correct_record_ary[Element['branch']] = [];
					}
					if(Element.post_ans_status == 1){
						student_total_correct_record_ary[Element['branch']].push(Element);	
					}
					student_total_record_ary[Element['branch']].push(Element);
				}
			})
	

		let subjectlist = [];
		let subjectcolorlist = [];
		let query = "";
		if(exam_type == 'NSTSE'){
			query = "select * from `subjects` left join exam_type on subjects.exam_type_id = exam_type.id where `subjects`.`exam_category_id` = 2 and `subjects`.`is_deleted` = 0 and `subjects`.`status` = 1 and subjects.group_exist = 2 and exam_type.type_name = '"+exam_type+"'";
		}
		else if(exam_type != 'NSTSE' && exam_type != 'NTSE'){
			query = "select * from `subjects` left join exam_type on subjects.exam_type_id = exam_type.id where `subjects`.`exam_category_id` = 2 and `subjects`.`is_deleted` = 0 and `subjects`.`status` = 1 and subjects.group_exist = 2 and exam_type.type_name = '"+exam_type+"'";
		}
		else{
			query = "select * from `subjects` left join exam_type on subjects.exam_type_id = exam_type.id where `subjects`.`exam_category_id` = 2 and `subjects`.`is_deleted` = 0 and `subjects`.`status` = 1 and subjects.group_exist = 2 and exam_type.type_name = '"+exam_type+"' and subjects.exam_subtype_id = "+exam_subtype_id;
		}
		await db.query(query)
		.then(result=>{
			result.forEach(element=>{
				//categories.push(element.name)
				subject_ary.push(element.subject_code);
				
				subjectlist[element.subject_code] = element.name;
				
				
			})
		})
		subject_ary.forEach(element=>{
			let student_correct_avg = 0;
			let market_correct_avg = 0;
			if(student_total_correct_record_ary[element]!=undefined){
			student_correct_avg = ((student_total_correct_record_ary[element].length/student_total_record_ary[element].length)*100).toFixed(2);
			market_correct_avg = ((total_correct_record_ary[element].length/total_record_ary[element].length)*100).toFixed(2);
			finaldataary_student.push(student_correct_avg);
			categories.push(subjectlist[element])
			subject_colors.push(subjectcolorlist[element]);
			}
		})
		
		
		//finalary.shift();// Removed First Blank elment from array
		
		res.status(200).send({status:200,msg:"Competitve Subject wise Comparasion",data:{series:[{data:finaldataary_student}],categories:categories}})
	}else{
		res.status(410).send({status:410,msg:"Internet Error.Off line.Try Again.",data:{}})
	}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/////////////////////////// Competititve PAGE 3 BOX 2  //////////////////////////////////////////
router.post('/getcompetitive_nonverbalcomparison',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let interm_final_ary = [];
		let finalary = [];
		let student_id = req.user.id;
		let exam_type = req.body.exam_type;
		let sub_type = req.body.sub_type;
		let subject_name = req.body.subject;
		let finaldataary_student = [];
		let finaldataary_student_color = [];
		let finaldataary = [];
		let categories = [];
		let categoriesary = [];
		let subject_ary = [];
		let total_correct_ans_ary = [];
		let total_record_ary = [];
		let total_correct_record_ary = [];
		let subject_colors = [];
		let subject_code = "";
		let exam_type_id = 0;
		let sub_type_id = 0;

		if(sub_type == 'SAT'){
			sub_type_id = 1;
		}
		if(sub_type == 'MAT'){
			sub_type_id = 2;
		}
		await db.query("select * from `exam_type` where `type_name` = '"+exam_type+"' and is_deleted = 0 and status = 1")
			.then(result=>{
				if(result.length > 0){
					exam_type_id = result[0].id;
				}
			});
		if(subject_name == ''){
			let query = "select * from `subjects` where `exam_category_id` = 2 and exam_type_id = "+exam_type_id+" and is_deleted = 0 and status = 1";
			if(exam_type_id == 1){ // NTSE = 1
				query = "select * from `subjects` where `exam_category_id` = 2 and exam_type_id = "+exam_type_id+" and is_deleted = 0 and status = 1 and exam_subtype_id = "+sub_type_id;
			}
			await db.query(query)
			.then(result=>{
				subject_code = result[0].subject_code;
				subject_name = result[0].name;
			})
		}else{
			await db.query("select * from `subjects` where `name` = '"+subject_name+"' and exam_type_id = "+exam_type_id+" and `exam_category_id` = 2 and is_deleted = 0 and status = 1")
			.then(result=>{
				subject_code = result[0].subject_code;
				subject_name = result[0].name;
			})
	}

	let allow_setno_for_calculation = 0;
		let query_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id where `exam_completed_competitive`.`exam_type` = '"+exam_type+"' and\
		 `exam_completed_competitive`.`student_id` = "+req.body.student_id;

		await db.query(query_data)
		.then(result=>{
			result.forEach(Element=>{
				if(Element.exam_type =='NTSE' && Element.exam_subtype_id == 2){
					allow_setno_for_calculation = Element.exam_set_counter;
				}else if(Element.exam_type =='NSTSE'){
					allow_setno_for_calculation = Element.exam_set_counter;
				}
				else{
					allow_setno_for_calculation = Element.exam_set_counter;
				}
			})
		})
		await db.query("select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id join questions on questions.id = online_exam_question_answers_competitive.question_id where exam_completed_competitive.exam_type = '"+exam_type+"' and exam_completed_competitive.student_id = "+student_id+" and questions.branch = '"+subject_code+"' GROUP by online_exam_question_answers_competitive.question_id")
		.then(result=>{
			result.forEach(Element=>{
				if(allow_setno_for_calculation >= Element['exam_set_counter'])
				{
					if(total_record_ary[Element['exam_set_counter']] == null)
					{
						total_record_ary[Element['exam_set_counter']] = [];
						total_correct_record_ary[Element['exam_set_counter']] = [];
					}
					if(Element.post_ans_status == 1){
						total_correct_record_ary[Element['exam_set_counter']].push(Element);	
					}
					total_record_ary[Element['exam_set_counter']].push(Element);
					categories.push(Element['exam_set_counter']);
				}
			})
		})
		categories = categories.filter(function(elem, pos) {
			return categories.indexOf(elem) == pos;
		})
		categories.sort();

		categories.forEach(element=>{
			categoriesary.push(["Set "+element]);
			let percentage_value = ((total_correct_record_ary[element].length/total_record_ary[element].length)*100).toFixed(2);
			let color_value = "#fff";
			if(percentage_value < 70){
				color_value = "#982626";
			}
			else if(percentage_value >= 70 && percentage_value < 79){
				color_value = "#f1c431";
			}
			else if(percentage_value >= 80 && percentage_value < 89){
				color_value = "#5bba47";
			}
			else if(percentage_value >= 90){
				color_value = "#31c5f4";
			}
			finaldataary_student_color.push(color_value);
			finaldataary_student.push(percentage_value);
		})	
		//finalary.shift();// Removed First Blank elment from array
		
		res.status(200).send({status:200,msg:"Competitve Subject wise Comparasion",data:{series:[{data:finaldataary_student,colors:finaldataary_student_color}],categories:categoriesary,subject_name:subject_name}})
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/////////////////////////// PAGE NO 19 ////////////////////////////////
router.post('/getcompare_diffarent_subject_score_ntse',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let interm_final_ary = {};
		let finalary = {};
		let finalary_wrong = {};
		let finaldataary = {};
		let total_ans_ary = [];
		let subject_ary = [];
		let total_record_ary = {};
		await db.query("select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,\
		online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,\
		questions.branch,subjects.name as subject_name,subjects.id as subject_id from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id \
		left join questions on questions.id = online_exam_question_answers_competitive.question_id \
		left join branches on branches.branch_code = questions.branch \
		left join subjects on subjects.id = branches.subject_id \
		where `exam_completed_competitive`.`exam_type` = 'NTSE' and `exam_completed_competitive`.`student_id` = "+req.body.student_id)
		.then(result=>{
			result.forEach(Element=>{
				if (!subject_ary.includes(Element['subject_id'])) {
					subject_ary.push(Element['subject_id'])
				}
				if(total_ans_ary[Element['subject_id']] == null)
				{
					//total_ans_ary[Element['subject_id']] = [];
				}
				
				total_ans_ary.push(Element);
			})
		})

		let subscription_details = await purchased_subscribtions.get_purchased_subscription_details(req.body);

		let total_set_no = (subscription_details['competive_purchase'][0]['no_set'])

		//console.log(total_ans_ary)
		total_ans_ary.forEach(element=>{
			if(finaldataary[element['subject_name']] == null)
				{
					finaldataary[element['subject_name']] = [];
				}
				if(finaldataary[element['subject_name']][element['exam_set_counter']] == null)
				{
					finaldataary[element['subject_name']][element['exam_set_counter']] = [];
				}
				finaldataary[element['subject_name']][element['exam_set_counter']].push(element);
		
		})

		for(var idx in finaldataary) {

			if(interm_final_ary[idx] == null)
				{
					interm_final_ary[idx] = [];
				}
				for(var idx2 in finaldataary[idx]) {
					if(interm_final_ary[idx][idx2] == null)
					{
						interm_final_ary[idx][idx2] = [];
					}
					interm_final_ary[idx][idx2] = finaldataary[idx][idx2]
				}
		}
		for(var idx in interm_final_ary) {
			if(finalary[idx] == null)
				{
					finalary[idx] = [];
				}
			for(var idx2 in interm_final_ary[idx]) {
				if(finalary[idx][idx2] == null)
				{
					finalary[idx][idx2] = [];
				}
				for(var idx3 in interm_final_ary[idx][idx2]) {
					if(finalary[idx][idx2][idx3] == null && interm_final_ary[idx][idx2][idx3]['post_ans_status'] == 1)
					{
						finalary[idx][idx2][idx3] = [];
					}
					if(interm_final_ary[idx][idx2][idx3]['post_ans_status'] == 1){
						finalary[idx][idx2][idx3] = interm_final_ary[idx][idx2][idx3];
					}
				}
			}
		}

		for(var idx in interm_final_ary) {
			if(finalary_wrong[idx] == null)
				{
					finalary_wrong[idx] = [];
				}
			for(var idx2 in interm_final_ary[idx]) {
				if(finalary_wrong[idx][idx2] == null)
				{
					finalary_wrong[idx][idx2]= [];
				}
				for(var idx3 in interm_final_ary[idx][idx2]) {
					if(finalary_wrong[idx][idx2][idx3] == null && interm_final_ary[idx][idx2][idx3]['post_ans_status'] == 0)
					{
						finalary_wrong[idx][idx2][idx3] = [];
					}
					if(interm_final_ary[idx][idx2][idx3]['post_ans_status'] == 0){
						finalary_wrong[idx][idx2][idx3] = interm_final_ary[idx][idx2][idx3];
					}
				}
			}
		}

		for(var idx in finalary_wrong) {
			if(total_record_ary[idx] == null)
				{
					total_record_ary[idx] = [];
				}
			for(var idx2 in finalary_wrong[idx]) {
				if(total_record_ary[idx][idx2 - 1] == null)
				{
					total_record_ary[idx][idx2 - 1] = [];
				}
				let total_correct = finalary[idx][idx2].length;
				let total_wrong = finalary_wrong[idx][idx2].length;
				let total_record = total_correct + total_wrong;

					//total_record_ary[idx][idx2][0] = total_record;
					//total_record_ary[idx][idx2][0] = total_correct;
					//total_record_ary[idx][idx2][2] = total_wrong;
					total_record_ary[idx][idx2 - 1][0] = ((total_correct/total_record)*100).toFixed(2);
			}
		}
		let increment = 1;
		for(var idx in total_record_ary) {
			if(total_record_ary[idx] == null)
				{
					total_record_ary[idx] = [];
				}
				let total_avg_total = 0;
				let total_count = 0;
			for(var idx2 =0; idx2< total_set_no;idx2++) {
				if(total_record_ary[idx][idx2] == null)
				{
					total_record_ary[idx][idx2] = [];
				}
					if(total_record_ary[idx][idx2][0] != undefined){
						total_avg_total += parseInt(total_record_ary[idx][idx2][0]);
						total_count++;
					}
			}
			let total_record = total_record_ary[idx].length;
			if(total_record_ary[idx][total_record] == null)
				{
					total_record_ary[idx][total_record] = [];
				}
				
			total_record_ary[idx][total_record][0] = (total_avg_total/total_count).toFixed(2)
		}
		/*finaldataary.forEach(element=>{
			if(interm_final_ary[element['subject_id']] == null)
				{
					finaldataary[element['subject_id']] = [];
				}
				finaldataary[element['subject_id']].push(element);
		
		})*/
		
		//finalary.shift();// Removed First Blank elment from array
		
		res.status(200).send({status:200,msg:"Set wise score comparison(NTSE)",data:total_record_ary})
		
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/////////////////////////// PAGE NO 2 BOX 1 ////////////////////////////////
router.post('/getcompetitive_specific_setwise_score_ntse' ,adminMiddleware.validateToken , async function(req,res,next){
    try{
		let interm_final_ary = [];
		let finalary = [];
		let finaldataary = [];
		let intermary_two = [];
		let intermary_three = [];
		let total_correct_ans_ary = [];
		let total_record_ary = [];
		let ntse_branchary = [];
		let ntse_branchary_mat = ['NV','NM'];
		await db.query("select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id join questions on questions.id = online_exam_question_answers_competitive.question_id where \
		`exam_completed_competitive`.`exam_set_counter` = "+req.body.set_no+" and `exam_completed_competitive`.`student_id` = "+req.body.student_id)
		.then(result=>{
			result.forEach(Element=>{
				if(total_correct_ans_ary[Element['exam_set_counter']] == null)
				{
					total_correct_ans_ary[Element['exam_set_counter']] = [];
				}
					total_correct_ans_ary[Element['exam_set_counter']].push(Element);
				if(Element['branch'] != 'NV' || Element['branch'] == 'NM')
				{
					if(!ntse_branchary.includes(Element['branch']))
					{
						ntse_branchary.push(Element['branch'])	
					}
				}
			})
		})
		
		total_correct_ans_ary.forEach(element=>{
		if(element.length > 0){	
			if(finalary[element[0]['exam_set_counter']] == null)
				{
					finalary[element[0]['exam_set_counter']] = [];
				}
				let set_no = element[0]['exam_set_counter'];
				let total_correct_sat = 0;
				let total_incorrect_sat = 0;
				let total_question_sat = 0;
				let total_attended_sat = 0;
				let total_notattended_sat = 0;
				let total_attended_mat = 0;
				let total_notattended_mat = 0;
				let total_question_mat = 0;
				let total_correct_mat = 0;
				let total_incorrect_mat = 0;
				for(let i = 0;i < total_correct_ans_ary[set_no].length;i++)
				{
					if(total_correct_ans_ary[set_no][i]['branch'] != 'NV' || total_correct_ans_ary[set_no][i]['branch'] != 'NM')
					{
						if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 1)
						{
							total_correct_sat++;
						}else if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 0 && total_correct_ans_ary[set_no][i]['post_ans'] != 'undefined'){
							total_incorrect_sat++;
						}
						if(total_correct_ans_ary[set_no][i]['post_ans'] != 'undefined')
						{
							total_attended_sat++;
						}else{
							total_notattended_sat++;
						}
						total_question_sat++;
					}
					if(total_correct_ans_ary[set_no][i]['branch'] == 'NV' || total_correct_ans_ary[set_no][i]['branch'] == 'NM')
					{
						if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 1)
						{
							total_correct_mat++;
						}else if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 0 && total_correct_ans_ary[set_no][i]['post_ans'] != 'undefined'){
							total_incorrect_mat++;
						}
						if(total_correct_ans_ary[set_no][i]['post_ans'] != 'undefined')
						{
							total_attended_mat++;
						}else{
							total_notattended_mat++;
						}
						total_question_mat++;
					}
				}
				let total_ans = total_correct_sat + total_correct_mat;
				finaldataary.push({"set_no":set_no,"total_correct_sat":total_correct_sat,"total_correct_mat":total_correct_mat,"total_records":total_ans,
			'total_question_mat':total_question_mat,'total_question_sat':total_question_sat,'total_attended_sat':total_attended_sat,'total_attended_mat':total_attended_mat,
		'total_notattended_mat':total_notattended_mat,'total_notattended_sat':total_notattended_sat,'total_incorrect_mat':total_incorrect_mat,'total_incorrect_sat':total_incorrect_sat});
			}
		})

		ntse_branchary.forEach(element_outer=>{
			if(intermary_two[element_outer] == null)
			{
				intermary_two[element_outer] = [];
			}
			let set_no = req.body.set_no;
			let total_correct_sat = 0;
			let total_incorrect_sat = 0;
			let total_question_sat = 0;
			let total_attended_sat = 0;
			let total_notattended_sat = 0;
				for(let i = 0;i < total_correct_ans_ary[set_no].length;i++)
				{
					if(total_correct_ans_ary[set_no][i]['branch'] == element_outer)
					{
						if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 1)
						{
							total_correct_sat++;
						}else if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 0 && total_correct_ans_ary[set_no][i]['post_ans'] != 'undefined'){
							total_incorrect_sat++;
						}
						if(total_correct_ans_ary[set_no][i]['post_ans'] != 'undefined')
						{
							total_attended_sat++;
						}else{
							total_notattended_sat++;
						}
						total_question_sat++;
						intermary_two[element_outer] = ({"branch_name":element_outer,"set_no":set_no,"total_correct":total_correct_sat,'total_question':total_question_sat,
						'total_attended':total_attended_sat,'total_notattended':total_notattended_sat,'total_incorrect':total_incorrect_sat,
					'score':total_correct_sat})
					}
				}
		})

		ntse_branchary_mat.forEach(element_outer=>{
			if(intermary_three[element_outer] == null)
			{
				intermary_three[element_outer] = [];
			}
			let set_no = req.body.set_no;
			let total_correct_sat = 0;
			let total_incorrect_sat = 0;
			let total_question_sat = 0;
			let total_attended_sat = 0;
			let total_notattended_sat = 0;
				for(let i = 0;i < total_correct_ans_ary[set_no].length;i++)
				{
					if(total_correct_ans_ary[set_no][i]['branch'] == element_outer)
					{
						if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 1)
						{
							total_correct_sat++;
						}else if(total_correct_ans_ary[set_no][i]['post_ans_status'] == 0 && total_correct_ans_ary[set_no][i]['post_ans'] != 'undefined'){
							total_incorrect_sat++;
						}
						if(total_correct_ans_ary[set_no][i]['post_ans'] != 'undefined')
						{
							total_attended_sat++;
						}else{
							total_notattended_sat++;
						}
						total_question_sat++;
						intermary_three[element_outer] = ({"branch_name":element_outer,"set_no":set_no,"total_correct":total_correct_sat,'total_question':total_question_sat,
						'total_attended':total_attended_sat,'total_notattended':total_notattended_sat,'total_incorrect':total_incorrect_sat,
					'score':total_correct_sat})
					}
				}
		})
		let finaldataary_two = {};
		ntse_branchary.forEach(element=>{
			let branch_code = element;
			finaldataary_two[branch_code] = ((intermary_two[branch_code]));
		})


		let finaldataary_three = {};
		ntse_branchary_mat.forEach(element=>{
			let branch_code = element;
			finaldataary_three[branch_code] = ((intermary_three[branch_code]));
		})
		
		res.status(200).send({status:200,msg:"Set wise score comparison(NTSE)",data:{firstary:finaldataary[0],
			secondary:(finaldataary_two),thirdary:(finaldataary_three)}})
		
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/////////////////////////// PAGE NO 1 BOX 3 ////////////////////////////////
///Compare Scholastic VS Competitive
router.post('/compare_scholastic_competitive' ,adminMiddleware.validateToken , async function(req,res,next){
	let user_id = req.user.id;
	let board_id = req.user.board;
	let class_no = req.user.class;
	let group_subject_id = req.body.group_subject_id;
	let exam_type = req.body.exam_type;
	let exam_type_ary = [];
	let result_data = {};
	let subjects_data_ary = [];
	let math_subjects = ['AL','AR','GM'];
	if(exam_type != undefined)
	{
	await db.query("select * from `subjects` left join  exam_type on  exam_type.id = subjects.exam_type_id where `subjects`.`exam_category_id` = 1 and `subjects`.`is_deleted` = 0 and `subjects`.`status` = 1 and `subjects`.`group_exist` = 2")
	.then(result=>{
		if(result_data['labels'] == null){
			result_data['labels'] = [];
		}
		result.forEach(element=>{
			if(!result_data['labels'].includes(element.name) && !result_data['labels'].includes("Math("+element.subject_code+")"))
			{
				subjects_data_ary.push(element.subject_code);
				if(math_subjects.includes(element.subject_code))
				{
					result_data['labels'].push("Math("+element.subject_code+")");
				}else{
					result_data['labels'].push(element.name);
				}
			}
		})
	})
	let query_data = "";
if(exam_type !='Competitive')
{
	query_data = "select * from `subjects` left join  exam_type on  exam_type.id = subjects.exam_type_id where `subjects`.`exam_category_id` = 2 and `subjects`.`is_deleted` = 0 and `subjects`.`status` = 1 and `subjects`.`group_exist` = 2 and  exam_type.type_name = '"+exam_type+"' order by name ASC";
}else{
	query_data = "select * from `subjects` left join  exam_type on  exam_type.id = subjects.exam_type_id where `subjects`.`exam_category_id` = 2 and `subjects`.`is_deleted` = 0 and `subjects`.`status` = 1 and `subjects`.`group_exist` = 2 order by name ASC";
}
	await db.query(query_data)
	.then(result=>{
		if(result_data['labels'] == null){
			result_data['labels'] = [];
		}
		result.forEach(element=>{
			if(!subjects_data_ary.includes(element.subject_code))
			{
				result_data['labels'].push(element.name);
				subjects_data_ary.push(element.subject_code);
			}
		})
	})


	let scholastic_exam_all_ans = {};
	let scholastic_exam_right_ans = {};
	await db.query("select online_exam_question_answers.*,questions.branch,questions.question_type,question_pattern.marks from `online_exam_question_answers` left join exam_completed on exam_completed.exam_unique_id = online_exam_question_answers.exam_unique_id left join questions on online_exam_question_answers.question_id = questions.id left JOIN question_pattern on question_pattern.short_code = questions.question_type where `online_exam_question_answers`.`student_id` = "+user_id+" and exam_completed.subject_group_id = "+group_subject_id)
	.then(result=>{
		result.forEach(element=>{
			if(scholastic_exam_right_ans[element.branch] == null){
				scholastic_exam_right_ans[element.branch] = [];
				scholastic_exam_all_ans[element.branch] = [];
			}
			scholastic_exam_all_ans[element.branch].push(element);
			if(element.post_ans_status == 1){
				scholastic_exam_right_ans[element.branch].push(element);
			}
		})
	})
	let scholastic_data = [];
	subjects_data_ary.forEach(element=>{
		let percentage = 0;
		if(scholastic_exam_right_ans[element] != undefined)
		{	
			let total_marks = 0;
			let current_marks = 0;
			for (let i = 0; i < scholastic_exam_all_ans[element].length; i++ ) {
				total_marks += scholastic_exam_all_ans[element][i].marks;
			  }
			  for (let i = 0; i < scholastic_exam_right_ans[element].length; i++ ) {
				current_marks += scholastic_exam_right_ans[element][i].marks;
			  }
			percentage = ((current_marks/total_marks)*100).toFixed(2);
		}
		scholastic_data.push(percentage);
	})
	let competitve_data = [];
	let competitive_exam_all_ans = {};
	let competitive_exam_right_ans = {};


let allow_setno_for_calculation = 0;
let query_data_search = "";
if(exam_type !='Competitive')
{	
		query_data_search = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id where `exam_completed_competitive`.`exam_type` = '"+exam_type+"' and\
		 `exam_completed_competitive`.`student_id` = "+req.body.student_id;
}else{
	query_data_search = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id where `exam_completed_competitive`.`student_id` = "+req.body.student_id;
}
		await db.query(query_data_search)
		.then(result=>{
			result.forEach(Element=>{
				if(Element.exam_type =='NTSE' && Element.exam_subtype_id == 2)
				{
					allow_setno_for_calculation = Element.exam_set_counter;
				}else if(Element.exam_type =='NSTSE'){
					allow_setno_for_calculation = Element.exam_set_counter;
				}
				else{
					allow_setno_for_calculation = Element.exam_set_counter;
				}
			})
		})

query_data = "";
let datasets = [];
if(exam_type =='Competitive'){
await db.query("select * from `exam_type` where status = 1 and is_deleted = 0")
.then(result=>{
	if(result.length > 0){
		result.forEach(element=>{
			exam_type_ary.push(element);
		})
	}
})
}else{
	await db.query("select * from `exam_type` where status = 1 and is_deleted = 0 and type_name = '"+exam_type+"'")
.then(result=>{
	if(result.length > 0){
		result.forEach(element=>{
			exam_type_ary.push(element);
		})
	}
})
}

if(exam_type !='Competitive')
{
	let request_data = {student_id:req.user.id,exam_category_id:1};
	let group_data = await purchased_subscribtion_details.get_group_subjectlists(request_data);
	
	scholastic_exam_all_ans = {};
	scholastic_exam_right_ans = {};
	await db.query("select online_exam_question_answers.*,questions.branch,questions.question_type,question_pattern.marks,exam_completed.subject_group_id as group_subject_id from `online_exam_question_answers` left join exam_completed on exam_completed.exam_unique_id = online_exam_question_answers.exam_unique_id left join questions on online_exam_question_answers.question_id = questions.id left JOIN question_pattern on question_pattern.short_code = questions.question_type where `online_exam_question_answers`.`student_id` = "+user_id)
	.then(result=>{
		result.forEach(element=>{
			if(scholastic_exam_right_ans[element.group_subject_id] == null){
				scholastic_exam_right_ans[element.group_subject_id] = [];
				scholastic_exam_all_ans[element.group_subject_id] = [];
			}
			if(scholastic_exam_right_ans[element.group_subject_id][element.branch] == null){
				scholastic_exam_right_ans[element.group_subject_id][element.branch] = [];
				scholastic_exam_all_ans[element.group_subject_id][element.branch] = [];
			}
			scholastic_exam_all_ans[element.group_subject_id][element.branch].push(element);
			if(element.post_ans_status == 1){
				scholastic_exam_right_ans[element.group_subject_id][element.branch].push(element);
			}
		})
	})

if(group_data)
{	
	group_data.subjects_list.forEach(async element_ounter=>{
		let scholastic_data = [];	
		
	subjects_data_ary.forEach(element=>{
		let percentage = 0;
		
		if(scholastic_exam_right_ans[element_ounter.subejct_id] != undefined)
		{
			
			if(scholastic_exam_right_ans[element_ounter.subejct_id][element] != undefined)
		{	
			
			let total_marks = 0;
			let current_marks = 0;
			
			for (let i = 0; i < scholastic_exam_all_ans[element_ounter.subejct_id][element].length; i++ ) {
				total_marks += scholastic_exam_all_ans[element_ounter.subejct_id][element][i].marks;
			  }
			  for (let i = 0; i < scholastic_exam_right_ans[element_ounter.subejct_id][element].length; i++ ) {
				current_marks += scholastic_exam_right_ans[element_ounter.subejct_id][element][i].marks;
			  }
			percentage = ((current_marks/total_marks)*100).toFixed(2);
			}
		}
		scholastic_data.push(percentage);
			
	})

	datasets.push({'label':element_ounter.subject_name,data:scholastic_data,borderColor: "#94AC4B",borderWidth: "2",backgroundColor: "#94AC4B",tension: 0.4});
})
}
}
else{
datasets.push({'label':"Scholastic",data:scholastic_data,borderColor: "#94AC4B",borderWidth: "2",backgroundColor: "#94AC4B",tension: 0.4});
}
if(exam_type !='Competitive')
{
	query_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id join questions on questions.id = online_exam_question_answers_competitive.question_id where exam_completed_competitive.exam_type = '"+exam_type+"' and online_exam_question_answers_competitive.student_id = "+user_id+" GROUP by online_exam_question_answers_competitive.question_id";
}else{
	query_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch from `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id join questions on questions.id = online_exam_question_answers_competitive.question_id where online_exam_question_answers_competitive.student_id = "+user_id+" GROUP by online_exam_question_answers_competitive.question_id";
}
let competititve_data = await db.query(query_data);

exam_type_ary.forEach(async exam_type_element=>{
	
				if(competititve_data.length > 0){
					competititve_data.forEach(element=>{
						if(element.exam_type == exam_type_element.type_name)
						{
							if(allow_setno_for_calculation >= element.exam_set_counter)
							{
								if(competitive_exam_all_ans[element.branch] == null){
									competitive_exam_all_ans[element.branch] = [];
									competitive_exam_right_ans[element.branch] = [];
								}
								competitive_exam_all_ans[element.branch].push(element);
								if(element.post_ans_status == 1){
									competitive_exam_right_ans[element.branch].push(element);
								}
							}
						}
					})
				}
				competitve_data = [];		
		subjects_data_ary.forEach(element=>{
			let competititve_percentage = 0;
			
				if(competitive_exam_right_ans[element]){
					//console.log(element,competitive_exam_right_ans[element].length,competitive_exam_all_ans[element].length);

					competititve_percentage = ((competitive_exam_right_ans[element].length/competitive_exam_all_ans[element].length)*100).toFixed(2);
				}
				competitve_data.push(competititve_percentage);
			
	})
	competitive_exam_all_ans = [];
	competitive_exam_right_ans = [];
	datasets.push({'label':exam_type_element.type_name,data:competitve_data,borderColor: exam_type_element.color_code,
	borderWidth: "2",
	backgroundColor: exam_type_element.color_code,
	tension: 0.4,});
})
	
	res.status(200).send({status:200,msg:"Compare Scholastic and Competitive",data:{'labels':result_data['labels'],datasets}})
	}else{
		res.status(400).send({status:400,msg:"Internet Error.Off line.Try Again.",data:{}})
	}
});


///////////////// E - LIBRARY PERFORMANCE SCORE CARD /////////////////////////////////
//////////////////////////// CARD NO 1 SESSION TIME ///////////////////////////////

router.post('/elibrary_session_time' ,adminMiddleware.validateToken , async function(req,res,next){
	let user_id = req.user.id;
	try{
		let exam_category_id = req.body.exam_category_id;
		let exam_type_id = req.body.exam_type_id;
		const Promise1 = new Promise(async (resolve, reject) => {
			let subjects_ary_list = [0];
		await db.query("select * from `subjects` where `is_deleted` = 0 and `status` = 1 and `exam_type_id` = "+exam_type_id+" and `exam_category_id` = "+exam_category_id)
		.then(result=>{
			result.forEach(element=>{
				subjects_ary_list.push(element.id);
			})
			resolve(subjects_ary_list);
		})
	})
		let subject_ary = [];
		let categories = [];
		let session_duration = [];
		let series = [];
		Promise1.then(async data=>{
		await db.query("SELECT sum(elibrary_access_log.time_spend) as total_time,elibrary_access_log.subject_id,subjects.name as subject_name,subjects.exam_category_id,exam_categories.category FROM `elibrary_access_log` left join subjects on subjects.id = elibrary_access_log.subject_id left join exam_categories on exam_categories.id = subjects.exam_category_id WHERE elibrary_access_log.student_id ="+user_id+" and subject_id in ("+data+") group by subjects.name")
		.then(result=>{
			result.forEach(element=>{
				subject_ary.push(element.subject_id);
				categories.push(element.subject_name);
				session_duration.push(Math.round(element.total_time/60));
			})			
		})
		series.push({name:"Session duration",data:session_duration});
		res.status(200).send({status:200,msg:"Session Time against partcular subject in mins",data:{series,categories}})
	})
	}
	catch(e){
		res.status(200).send({staus:410,msg:"Error in performance score card"})
	}
});

//////////////////////////// CARD NO 2 MOST VISITED SUBJECT ///////////////////////////////

router.post('/elibrary_most_visited_subjects' ,adminMiddleware.validateToken , async function(req,res,next){
	let user_id = req.user.id;
	try{
		let subject_ary = [];
		let categories = [];
		let most_visit = [];
		let series = [];
		let exam_category_id = req.body.exam_category_id;
		let exam_type_id = req.body.exam_type_id;
		const Promise1 = new Promise(async (resolve, reject) => {
			let subjects_ary_list = [0];
		await db.query("select * from `subjects` where `is_deleted` = 0 and `status` = 1 and `exam_type_id` = "+exam_type_id+" and `exam_category_id` = "+exam_category_id)
		.then(result=>{
			result.forEach(element=>{
				subjects_ary_list.push(element.id);
			})
			resolve(subjects_ary_list);
		})
	})
	Promise1.then(async data=>{
		await db.query("SELECT count(elibrary_visit_log.subject_id) as most_visit,elibrary_visit_log.subject_id,subjects.name as subject_name,subjects.exam_category_id,exam_categories.category FROM `elibrary_visit_log` left join subjects on subjects.id = elibrary_visit_log.subject_id left join exam_categories on exam_categories.id = subjects.exam_category_id WHERE elibrary_visit_log.student_id ="+user_id+" and elibrary_visit_log.subject_id IN ("+data+") group by subjects.name order by most_visit desc")
		.then(result=>{
			result.forEach(element=>{
				subject_ary.push(element.subject_id);
				categories.push(element.subject_name);
				
				most_visit.push((Math.round(element.most_visit)));
			})			
		})
		
		series.push({name:"Most visted subject",data:most_visit});
		res.status(200).send({status:200,msg:"Most visited subject",data:{series,categories}})
	})
	}
	catch(e){
		res.status(200).send({staus:410,msg:"Error in performance score card",e})
	}
});

//////////////////////////// CARD NO 3 Most Search Question ///////////////////////////////

router.post('/elibrary_most_search_questions' ,adminMiddleware.validateToken , async function(req,res,next){
	let user_id = req.user.id;
	try{
		let subject_ary = [];
		let categories = [];
		let most_search = [];
		let series = [];
		let exam_category_id = req.body.exam_category_id;
		let exam_type_id = req.body.exam_type_id;
		const Promise1 = new Promise(async (resolve, reject) => {
			let subjects_ary_list = [0];
		await db.query("select * from `subjects` where `is_deleted` = 0 and `status` = 1 and `exam_type_id` = "+exam_type_id+" and `exam_category_id` = "+exam_category_id)
		.then(result=>{
			result.forEach(element=>{
				subjects_ary_list.push(element.id);
			})
			resolve(subjects_ary_list);
		})
	})
	Promise1.then(async data=>{
		await db.query("SELECT count(subject_id) as total_search,searched_questions.search_text,subjects.name as subject_name from `searched_questions` left join subjects on searched_questions.subject_id = subjects.id where `searched_questions`.`student_id` = "+user_id+" and `searched_questions`.`subject_id` IN ("+data+") group by subjects.name order by total_search desc limit 10")
		.then(result=>{
			result.forEach(element=>{
				subject_ary.push(element.subject_id);
				categories.push(element.subject_name);
				most_search.push(element.total_search);
			})			
		})
		series.push({name:"Most search questions",data:most_search});
		res.status(200).send({status:200,msg:"Most search questions",data:{series,categories}})
	})
	}
	catch(e){
		res.status(200).send({staus:410,msg:"Error in performance score card",e})
	}
});



router.post('/wheredoyoustand_competitive',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let interm_final_ary = {};
		let finalary = [];
		let finaldataary = [];
		let intermary_two = [];
		let intermary_three = [];
		let total_correct_ans_ary = [];
		let total_record_ary = [];
		let branchary = [];
		let user_id = req.user.id;
		let questions_data_ary = [];
		let exam_type = req.body.exam_type;
		let exam_subtype = req.body.exam_subtype;
		let set_no = req.body.set_no;
		let questions_type_ary = [];
		if(exam_type != undefined && exam_subtype != undefined && set_no != undefined)
		{
		await db.query("select * from `question_pattern` where `is_deleted` = 0 and `status` = 1")
		.then(result=>{
			result.forEach(element=>{
				questions_type_ary[element.short_code] = element.marks;
			});
		});
		let exam_type_id = 0;
		await db.query("select * from `exam_type` where `is_deleted` = 0 and `status` = 1 and type_name = '"+exam_type+"'")
		.then(result=>{
			result.forEach(element=>{
				exam_type_id = element.id;
			});
		});
		let subject_group_ary = [];
		let get_non_grouped_subject_ary = [];

		let exam_subtype_id = 0;
		if(exam_type == 'NTSE'){
			if(exam_subtype == 'SAT'){
				exam_subtype_id = 1;
			}
			else if(exam_subtype == 'MAT'){
				exam_subtype_id = 2;
			}
		}

		await db.query("select * from `subjects` where `exam_category_id` = 2 and `group_exist` = 2 and `status` = 1 and `is_deleted` = 0 and exam_type_id = "+exam_type_id+" and exam_subtype_id = "+exam_subtype_id)
		.then(result=>{
			result.forEach(element=>{
				subject_group_ary[element.subject_code] = element.subject_code;
				get_non_grouped_subject_ary[element.id] = element.subject_code;
			});
		});
	
		await db.query("select * from `subjects` where `exam_category_id` = 2 and `group_exist` = 1 and `status` = 1 and `is_deleted` = 0 and exam_type_id = "+exam_type_id+" and exam_subtype_id = "+exam_subtype_id )
		.then(result=>{
			result.forEach(element=>{
				let subject_ary = element.group_subjects.split(",");
				subject_ary.forEach(element_inner=>{
					subject_group_ary[get_non_grouped_subject_ary[element_inner]] = element.subject_code;
				})
			})
		})
		await db.query("select exam_completed_competitive.*,questions.question_type,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status,questions.branch,questions.chapter_id,questions.chapter,subjects.name as subject_name,subjects.subject_code,chapters.sub_heading as chapter_name from `exam_completed_competitive` left join online_exam_question_answers_competitive on online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id join questions on questions.id = online_exam_question_answers_competitive.question_id left join subjects on subjects.subject_code = questions.branch left join chapters on chapters.id = questions.chapter_id where `questions`.`exam_category`= 2 and `exam_completed_competitive`.`student_id` = "+user_id+" and `exam_completed_competitive`.`exam_type` = '"+exam_type+"' GROUP by `online_exam_question_answers_competitive`.`question_id`")
		.then(result=>{
			/*if(result.length > 0){
			result.forEach(Element=>{
					if(!branchary.includes(Element['subject_code']))
					{
						branchary.push(Element['subject_code'])	
					}
				})
			}*/
			questions_data_ary = result;
		})
		let correct_questions_marks_ary = [];
		let all_questions_ary = [];
		questions_data_ary.forEach(element=>{
			if(finaldataary[element.subject_code] == null){
					finaldataary[element.subject_code] = [];
					correct_questions_marks_ary[element.subject_code] = [];
					all_questions_ary[element.subject_code] = [];
			}
			let chapter_no_ary = element.chapter.split("CH");
			let chapter_no = chapter_no_ary[1];
			if(element.post_ans_status == 1){
				if(correct_questions_marks_ary[element.subject_code][chapter_no] == null)
				{
					finaldataary[element.subject_code][chapter_no] = [];
					correct_questions_marks_ary[element.subject_code][chapter_no] = [];
				}
				finaldataary[element.subject_code][chapter_no].push(JSON.stringify(element));
				correct_questions_marks_ary[element.subject_code][chapter_no].push(questions_type_ary[element.question_type]);
				
			}
			if(finaldataary[element.subject_code][chapter_no] == null)
				{
					finaldataary[element.subject_code][chapter_no] = [];
					correct_questions_marks_ary[element.subject_code][chapter_no] = [];
				}
				finaldataary[element.subject_code][chapter_no].push(JSON.stringify(element));

			if(all_questions_ary[element.subject_code][chapter_no] == null)
				{
					all_questions_ary[element.subject_code][chapter_no] = [];
				}
				all_questions_ary[element.subject_code][chapter_no].push(1);
		})

		let subjectlist = [];
		let subjectcolorlist = [];
		let query = "";
		if(exam_type == 'NSTSE'){
			query = "select * from `subjects` left join exam_type on subjects.exam_type_id = exam_type.id where `subjects`.`exam_category_id` = 2 and `subjects`.`is_deleted` = 0 and `subjects`.`status` = 1 and subjects.group_exist = 2 and exam_type.type_name = '"+exam_type+"'";
		}
		else{
			query = "select * from `subjects` left join exam_type on subjects.exam_type_id = exam_type.id where `subjects`.`exam_category_id` = 2 and `subjects`.`is_deleted` = 0 and `subjects`.`status` = 1 and subjects.group_exist = 2 and exam_type.type_name = '"+exam_type+"'";
		}
		await db.query(query)
		.then(result=>{
			result.forEach(element=>{
				//categories.push(element.name)
				//subject_ary.push(element.subject_code);
				if(!subjectlist.includes(element.subject_code))
					{
						subjectlist.push(element.subject_code)	
					}
				//subjectlist[element.subject_code] = element.name;
				
				
			})
		})
		//console.log(all_questions_ary);
		//console.log(subjectlist);
		subjectlist.forEach(element=>{
			let chapterdata = [];
			//for(let i = 0;i<finaldataary[element].length;i++)
			finaldataary[element].forEach(element_inner=>{
			let parsedata = JSON.parse(element_inner[0]);
		
			let chapter_ary = parsedata.chapter.split("CH");
			let chapter = parseInt(chapter_ary[1]);

		let total_correct_marks = 0;
		let total_marks = 0;
		if(correct_questions_marks_ary[element][chapter].length > 0){		
			total_correct_marks = correct_questions_marks_ary[element][chapter].reduce((accumulator, currentValue) => {
				return accumulator + currentValue
			  },0);
			}
		
			if(all_questions_ary[element][chapter].length > 0){		
				total_marks = all_questions_ary[element][chapter].reduce((accumulator, currentValue) => {
					return accumulator + currentValue
				  },0);
				}	
			
				let correct_marks_avg = Math.round((total_correct_marks/total_marks)*100);
					//chapterdata['name'] = element;
					chapterdata.push({name:chapter,value:correct_marks_avg,chapter_name:parsedata.chapter_name});
				})
			
				chapterdata.sort((a, b) => b.value - a.value);

			if(interm_final_ary[subject_group_ary[element]] == null && element !=null && chapterdata.length > 0 && subject_group_ary[element] != undefined){
				interm_final_ary[subject_group_ary[element]] = [];
			}

			if(element !=null && chapterdata.length > 0 && subject_group_ary[element] != undefined)
			interm_final_ary[subject_group_ary[element]].push({"name":element.substr(0,3),data:chapterdata})
		})
		finalary.push(interm_final_ary);
		res.status(200).send({status:200,msg:"Where Do you stand for competititve",data:finalary})
	}else{
		res.status(410).send({status:410,msg:"Internet Error.Off line.Try Again.",data:{}})
	}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

/////////////////////////// Competititve PAGE 1 BOX 1  //////////////////////////////////////////

router.post('/getcompetitive_overall_score',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let interm_final_ary = [];
		let finalary = [];
		let ntseary = [];
		let nstseary = [];
		let total_correct_ans_ary = [];
		let total_incorrect_ans_ary = [];
		let total_record_ary = [];
		let exam_type = req.body.exam_type;
		let allow_setno_for_calculation = 0;
		if(exam_type != undefined && req.body.student_id != undefined)
		{
		let query_data = "select exam_completed_competitive.*,online_exam_question_answers_competitive.question_id,online_exam_question_answers_competitive.post_ans,online_exam_question_answers_competitive.post_ans_status from `exam_completed_competitive` left join online_exam_question_answers_competitive on \
		online_exam_question_answers_competitive.exam_unique_id = exam_completed_competitive.exam_unique_id where `exam_completed_competitive`.`exam_type` = '"+exam_type+"' and\
		 `exam_completed_competitive`.`student_id` = "+req.body.student_id;

		await db.query(query_data)
		.then(result=>{
			result.forEach(Element=>{
				if(Element.exam_type =='NTSE' && Element.exam_subtype_id == 2)
				{
					allow_setno_for_calculation = Element.exam_set_counter;
				}else if(Element.exam_type =='NSTSE'){
					allow_setno_for_calculation = Element.exam_set_counter;
				}
				else{
					allow_setno_for_calculation = Element.exam_set_counter;
				}
			})
		})

		await db.query(query_data)
		.then(result=>{
			result.forEach(Element=>{
				if(allow_setno_for_calculation >= Element.exam_set_counter)
				{
					if(interm_final_ary[Element['exam_set_counter']] == null)
					{
						interm_final_ary[Element['exam_set_counter']] = [];
					}
					interm_final_ary[Element['exam_set_counter']].push(Element);

					if(total_correct_ans_ary[Element['exam_set_counter']] == null)
					{
						total_correct_ans_ary[Element['exam_set_counter']] = [];
					}
					if(Element.post_ans_status == 1){
						total_correct_ans_ary[Element['exam_set_counter']].push(Element);
					}
				}
				
			})
		})
		interm_final_ary.forEach(element=>{
		if(total_record_ary["total_records"] == null)
				{
					total_record_ary["total_records"] = [];
				}
				total_record_ary["total_records"].push(element.length);
		})
		let counter = 0;
		let total_set_ntse = 0;
		let ntse_avg = 0;
		interm_final_ary.forEach(element=>{
		if(element.length > 0){	
			if(finalary[element[0]['exam_set_counter']] == null)
				{
					finalary[element[0]['exam_set_counter']] = [];
				}
				counter = element[0]['exam_set_counter'];
				let total_correct_ans = total_correct_ans_ary[counter].length;
				let total_ans = total_record_ary['total_records'][counter - 1];
				let total_incorrect_ans = total_ans - total_correct_ans;
				let avg = ((total_correct_ans/total_ans)*100).toFixed(2);
				ntse_avg += parseFloat(avg);
				total_set_ntse++;
				//console.log(interm_final_ary[element[0]['exam_set_counter']])
				ntseary.push({"avg":avg,"set_no":element[0]['exam_set_counter'],"total_correct_ans":total_correct_ans,"total_incorrect_ans":total_incorrect_ans,"total_records":total_ans});
			}
		})
		
		//ntseary.shift();// Removed First Blank elment from array
		ntse_avg = (ntse_avg/total_set_ntse).toFixed(2);
		
		
			res.status(200).send({status:200,msg:"Overall Competitive("+exam_type+") Performance Score(Avg.)",
			data:{Competitive_avg:ntse_avg,competitntseary:ntseary}})
	}
	else{
		res.status(410).send({status:410,msg:"Internet Error.Off line.Try Again.",data:{}})
	}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});


///////////////////// Scholastic PAGE NO 3.2 TABLE SECTION ////////////////////////////////////////
router.post('/scholastic_getsubjectwise_chapters_table_data',adminMiddleware.validateToken , async function(req,res,next){
	try{
		let finalary = [];
		let student_id = req.user.id;
		let standard = req.user.class;
		let group_subject_id = req.body.group_subject_id;
		let board = req.user.board;
		let subject_name = req.body.subject;
		let chapter = req.body.chapter;
		let exam_type = req.body.exam_type;
		let total_question_css_group = 5;
		let subject = "";
	if(subject_name !=undefined && exam_type !=undefined)
	{
		await db.query("select exam_completed.*,subjects.name as subject_name from `exam_completed` left join subjects on subjects.id = exam_completed.subject_id where `exam_completed`.`exam_type` = "+exam_type+" and `subjects`.`name` = '"+subject_name+"' and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`subject_group_id` = "+group_subject_id)
		.then(result=>{
			subject = result[0].subject_id;
		})	
		let questions_partten_ary = [];
		await db.query("select * from `question_pattern` where `is_deleted` = 0 and `status` = 1")
		.then(result=>{
			if(result.length >0)
			{
				result.forEach(element=>{
					questions_partten_ary[element.short_code] = element.marks;
					if(element.short_code == 'CSS')//Check Case study or not
				{
					//questions_partten_ary[element.short_code] = (element.marks/total_question_css_group);
				}
				})
			}
		});
		
		let correct_subject_chapter_ary = {};
		let details_chapter_exam_ary_interm = {};
		let details_chapter_exam_ary_interm_incorrent_ans = {};
		let details_chapter_exam_ary = {};
		let table_result_ary_interm = {};
		let table_result_ary = {};
		//console.log((subject_chapter_ary))
		let query = "";
		if(exam_type == 1){
			query = "select exam_completed.*,subjects.name as subject_name,chapters.chapter_no,chapters.chapter_name,chapters.sub_heading as chapter_heading,chapters.order_no,online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,online_exam_question_answers.question_id,questions.question_type from `exam_completed` left join `online_exam_question_answers` on `exam_completed`.`exam_unique_id` = `online_exam_question_answers`.`exam_unique_id` left join subjects on subjects.id = exam_completed.branch_id left join chapters on chapters.id = exam_completed.chapter_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_completed`.`exam_type` = "+exam_type+" and `exam_completed`.`subject_id` = "+subject+" and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`subject_group_id` = "+group_subject_id;

		}else if(exam_type > 1){
			query = "select exam_completed.*,subjects.name as subject_name,chapters.chapter_no,chapters.chapter_name,chapters.sub_heading as chapter_heading,chapters.order_no,online_exam_question_answers.post_ans_status,online_exam_question_answers.post_ans,online_exam_question_answers.question_id,questions.question_type from `exam_completed` left join `online_exam_question_answers` on `exam_completed`.`exam_unique_id` = `online_exam_question_answers`.`exam_unique_id` left join subjects on subjects.id = exam_completed.subject_id left join chapters on chapters.id = exam_completed.chapter_id left join questions on questions.id = online_exam_question_answers.question_id where `exam_completed`.`exam_type` = "+exam_type+" and `exam_completed`.`subject_id` = "+subject+" and `exam_completed`.`student_id` = "+student_id+" and `exam_completed`.`subject_group_id` = "+group_subject_id;
		}
		
		await db.query(query)
		.then(result=>{
			if(result.length > 0)
			{
				let exam_set_counter_ary = [];
				
					result.forEach(element=>{
						if(exam_type == 2){
							element.set_counter = element.exam_set_counter;
							element.exam_set_counter = 1;
						}
						else if(exam_type == 3){
							element.set_counter = element.exam_set_counter;
							element.exam_set_counter = 1;
						}
						if(element.case_study_exam == 1)
						{
							element.exam_set_counter = "case_study";
						}
						//element.exam_set_counter = parseInt(key) + 1;
						if(correct_subject_chapter_ary[element.exam_set_counter] == null){
							correct_subject_chapter_ary[element.exam_set_counter] = [];
							table_result_ary[element.exam_set_counter] = {};
							table_result_ary_interm[element.exam_set_counter] = {};
						}
						if(table_result_ary[element.exam_set_counter]['SWA'] == null){
							table_result_ary[element.exam_set_counter]['SWA'] = [];
							table_result_ary_interm[element.exam_set_counter]['SWA'] = [];
						}
						if(table_result_ary[element.exam_set_counter]['DES'] == null){
							table_result_ary[element.exam_set_counter]['DES'] = [];
							table_result_ary_interm[element.exam_set_counter]['DES'] = [];
						}
						if(table_result_ary[element.exam_set_counter]['HOT'] == null){
							table_result_ary[element.exam_set_counter]['HOT'] = [];
							table_result_ary_interm[element.exam_set_counter]['HOT'] = [];
						}
						if(table_result_ary[element.exam_set_counter]['CSS'] == null){
							table_result_ary[element.exam_set_counter]['CSS'] = [];
							table_result_ary_interm[element.exam_set_counter]['CSS'] = [];
						}
						if(details_chapter_exam_ary_interm[element.order_no] == null){
							details_chapter_exam_ary_interm[element.order_no] = [];
							//details_chapter_exam_ary[element.exam_set_counter] = [];
							details_chapter_exam_ary_interm_incorrent_ans[element.exam_set_counter] = [];
						}

						details_chapter_exam_ary_interm[element.order_no].push(element); 

						if(element.post_ans_status == 1){

							correct_subject_chapter_ary[element.exam_set_counter].push(questions_partten_ary[element.question_type]);
							table_result_ary_interm[element.exam_set_counter][element.question_type].push(questions_partten_ary[element.question_type]);
						}
						if(element.post_ans_status == 0 && element.post_ans !='undefined'){
							//details_chapter_exam_ary_interm_incorrent_ans[element.exam_set_counter].push(questions_partten_ary[element.question_type]);
						}
						
					})
		}
	})

	for (const key in details_chapter_exam_ary_interm) {
		for (const key2 in details_chapter_exam_ary_interm[key]) {
	
		if(details_chapter_exam_ary["CH"+details_chapter_exam_ary_interm[key][key2].order_no] == null)
		{
			details_chapter_exam_ary["CH"+details_chapter_exam_ary_interm[key][key2].order_no] = {};
		}
		if(details_chapter_exam_ary["CH"+details_chapter_exam_ary_interm[key][key2].order_no]["Test"+details_chapter_exam_ary_interm[key][key2].exam_set_counter] == null)
		{
			details_chapter_exam_ary["CH"+details_chapter_exam_ary_interm[key][key2].order_no]["Test"+details_chapter_exam_ary_interm[key][key2].exam_set_counter] = {};
		}
			
		}
			
	}
	
	for(const key in details_chapter_exam_ary)
	{
		for(const key2 in details_chapter_exam_ary[key])
		{
			let order_no_ary = key.split("CH");
			let order_no = order_no_ary[1];
			let total_question = 0;
			let total_correct = 0;
			let total_incorrect = 0;
			let total_attended = 0;
			let total_notattended = 0;
			let total_marks = 0;
			details_chapter_exam_ary_interm[order_no].forEach(element=>{
				if("Test"+element.exam_set_counter == key2){
					total_question++;
					if(element.post_ans_status == 1)
					{
						total_correct++;
						total_marks += questions_partten_ary[element.question_type];
					}
					if(element.post_ans_status == 0 && element.post_ans !='undefined')
					{
						total_incorrect++;
					}
					if(element.post_ans =='undefined')
					{
						total_notattended++;
					}
					total_attended = total_incorrect + total_correct;
				}
			})
			let exam_name = key2;
			if(key2 == 'Testcase_study')
			{
				exam_name = "Case Study";
			}
			finalary.push({total_notattended_no:total_notattended,total_attended:total_attended,total_incorrect:total_incorrect,total_correct:total_correct,total_marks:total_marks,total_question:total_question,chapter:key,exam:exam_name,subject_name:subject_name});
		}
	}

	let data = {};
	data['tabledata'] = finalary;


	//console.log(data)
		res.send({status:200,data:data});
}else{
	res.send({status:400,msg:"Internet Error.Off line.Try Again.",data:{}});
}
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});


/////////////// SCHOLASTIC PAGE 2 BOX 1///////////////////////////
router.post('/subjectwisescholasticscore',adminMiddleware.validateToken , async function(req,res,next){
    try{
		let board = req.user.board;
		let student_id = req.user.id;
		let group_subject_id = req.body.group_subject_id;
		let subjectary = [];
		let subjectary_module = [];
		let subjectary_mock = [];
		let subjectnameary = [];
		let subjectnameary_module = [];
		let subjectnameary_mock = [];
		let overalavg = 0;
		let finalary = {};
		let group_subjects = "";
		await db.query("select exam_completed.*,subjects.name as subject_name from exam_completed left join subjects on subjects.id = exam_completed.subject_id where exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+" group by exam_completed.subject_id")
		.then(result=>{
			result.forEach(element=>{	
					subjectary.push(element['subject_id']);
					subjectnameary.push(element['subject_name']);
			
			})
		})

		await db.query("select exam_completed.*,subjects.name as subject_name from exam_completed left join subjects on subjects.id = exam_completed.subject_id where exam_type = 2 and student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+" group by exam_completed.subject_id")
		.then(result=>{
			result.forEach(element=>{	
					subjectary_module.push(element['subject_id']);
					subjectnameary_module.push(element['subject_name']);
			
			})
		})

		await db.query("select exam_completed.*,subjects.name as subject_name from exam_completed left join subjects on subjects.id = exam_completed.subject_id where exam_type = 3 and student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+" group by exam_completed.subject_id")
		.then(result=>{
			result.forEach(element=>{	
					subjectary_mock.push(element['subject_id']);
					subjectnameary_mock.push(element['subject_name']);
			
			})
		})
	
//////////////////////////////////// Question Parteen Master ///////////////////////////
let question_pattern_ary = [];
await db.query("select * from `question_pattern` where `status` = 1 and `is_deleted` = 0")
.then(result=>{
	result.forEach(element=>{
		question_pattern_ary[element['short_code']] = element['marks'];
	})
})


/////////////////////// SET EXAM Performance ///////////////////////////////
let right_marks_subject_ary = {};
let total_marks_subject_ary = {};

let right_marks = 0;
let total_marks = 0;

		await db.query("select online_exam_question_answers.post_ans_status,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id,question_pattern.marks from `exam_completed` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type where `exam_category_id` = 1 and exam_completed.exam_type = 1 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+"")
		.then(result=>{
			result.forEach(element=>{	
				if(element['post_ans_status'] == 1){
					if(right_marks_subject_ary[element['subject_id']] == null){
						right_marks_subject_ary[element['subject_id']] = [];
						right_marks_subject_ary[element['subject_id']].push(element['marks']);
					}else{
						right_marks_subject_ary[element['subject_id']].push(element['marks']);
					}
					right_marks += element['marks'];
				}
				total_marks += element['marks'];
				if(total_marks_subject_ary[element['subject_id']] == null){
					total_marks_subject_ary[element['subject_id']]=[];				
						total_marks_subject_ary[element['subject_id']].push(element['marks']);
	
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						total_marks_subject_ary[element['subject_id']].push(element['marks']);
					}
				}
			})
		})
		finalary.label = subjectnameary;
		finalary.labels = [];
		finalary.labels.push(subjectnameary);
		finalary.labels.push(subjectnameary_module);
		finalary.labels.push(subjectnameary_mock);
		finalary.series = [];
//////////////// Calculate Average against Subjects SET ///////////////////////////
let marks_avg_ary = [];
let set_subject_marks = [];
let exist_record = 0;
	if(Object.keys(total_marks_subject_ary).length > 0){
		subjectary.forEach(k=>{
			var sum = 0;
			var sum2 = 0; 
			let avg_value = 0;
			if(total_marks_subject_ary[k] != undefined){
				//sum = total_marks_subject_ary[k].length;
				sum = total_marks_subject_ary[k].reduce(function (x, y) {
					return x + y;
				}, 0);
			}
			if(Object.keys(right_marks_subject_ary).length > 0){
				if(right_marks_subject_ary[k] != undefined){
				//sum2 = right_marks_subject_ary[k].length;	
				sum2 = right_marks_subject_ary[k].reduce(function (x, y) {
					return x + y;
				}, 0);
		}
		}
		if(sum2 > 0){
		 	avg_value = ((sum2/sum)*100);
		}
			marks_avg_ary.push(avg_value);
			set_subject_marks.push(avg_value.toFixed(2));
			exist_record++;
			
		});
		}

		let i = 0;
		subjectnameary.forEach(element=>{
			if(exist_record <= i){
			marks_avg_ary.push(0);
			}
			i++;
		})

		let marks_sum = marks_avg_ary.reduce(function (x, y) {
				return parseFloat(x) + parseFloat(y);
				}, 0);
		let set_overallavg = (marks_sum/marks_avg_ary.length).toFixed(2);

		finalary.series.push({"name":"Ch Test","data":set_subject_marks,"overall":set_overallavg});
		
/////////////////////// MODULE EXAM Performance ///////////////////////////////
let module_right_marks_subject_ary = {};
let module_total_marks_subject_ary = {};

let module_right_marks = 0;
let module_total_marks = 0;
let total_module_subject = 0;
		await db.query("select online_exam_question_answers.post_ans_status,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed` left join online_exam_question_answers on \
		online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on \
		questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and \
		exam_completed.exam_type = 2 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+"")
		.then(result=>{
			result.forEach(element=>{	
				if(element['post_ans_status'] == 1){
					if(module_right_marks_subject_ary[element['subject_id']] == null){
						module_right_marks_subject_ary[element['subject_id']] = [];
						module_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}else{
						module_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
					//right_marks += question_pattern_ary[element['question_type']];
				}
				//total_marks += question_pattern_ary[element['question_type']];
				if(module_total_marks_subject_ary[element['subject_id']] == null){
					module_total_marks_subject_ary[element['subject_id']]=[];				
					module_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
	
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						module_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
				}
			})
		})
		total_module_subject = Object.keys(module_total_marks_subject_ary).length;
	
		//////////////// Calculate Average against Subjects MODULE ///////////////////////////
		let module_marks_avg_ary = [];
		let module_subject_marks = [];
		exist_record = 0;
		if(Object.keys(module_total_marks_subject_ary).length > 0)
		{
			subjectary_module.forEach(k=>{
		
			var sum = 0;
			var sum2 = 0;
			let avg_value = 0;
			if(module_total_marks_subject_ary[k] != undefined){
				//sum = module_total_marks_subject_ary[k].length;
				sum = module_total_marks_subject_ary[k].reduce(function (x, y) {
				return x + y;
				}, 0);

			
			if(Object.keys(module_right_marks_subject_ary).length > 0){
				if(module_right_marks_subject_ary[k] != undefined){
					//sum2 = module_right_marks_subject_ary[k].length;
					sum2 = module_right_marks_subject_ary[k].reduce(function (x, y) {
					return x + y;
					}, 0);
				}
			}
			if(sum2 > 0){
				//console.log(sum2,"=====",sum);
				avg_value = ((sum2/sum)*100);
			}
			module_marks_avg_ary.push(avg_value);
			module_subject_marks.push(avg_value.toFixed(2));
			exist_record++;
		}else{
			module_subject_marks.push("0.00");
		}
		});
	}
	 i = 0;
		subjectnameary_module.forEach(element=>{
			if(exist_record <= i){
				module_marks_avg_ary.push(0);
			}
			i++;
		})
		let module_marks_sum = module_marks_avg_ary.reduce(function (x, y) {
			return parseFloat(x) + parseFloat(y);
			}, 0);
		let module_overallavg = (module_marks_sum/total_module_subject).toFixed(2);

		finalary.series.push({"name":"Module","data":module_subject_marks,"overall":module_overallavg});
		/////////////////////// MOCK EXAM Performance ///////////////////////////////
let mock_right_marks_subject_ary = {};
let mock_total_marks_subject_ary = {};

let mock_right_marks = 0;
let mock_total_marks = 0;
let total_mock_subject = 0;
		await db.query("select online_exam_question_answers.post_ans_status,exam_completed.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed` left join online_exam_question_answers on \
		online_exam_question_answers.exam_unique_id = exam_completed.exam_unique_id left join questions on \
		questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and \
		exam_completed.exam_type = 3 and exam_completed.student_id = "+student_id+" and exam_completed.subject_group_id = "+group_subject_id+"")
		.then(result=>{
			result.forEach(element=>{	
				if(element['post_ans_status'] == 1){
					if(mock_right_marks_subject_ary[element['subject_id']] == null){
						mock_right_marks_subject_ary[element['subject_id']] = [];
						mock_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}else{
						mock_right_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
					//right_marks += question_pattern_ary[element['question_type']];
				}
				//total_marks += question_pattern_ary[element['question_type']];
				if(mock_total_marks_subject_ary[element['subject_id']] == null){
					mock_total_marks_subject_ary[element['subject_id']]=[];				
					mock_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
	
				}else{
					if(question_pattern_ary[element['question_type']]!=''){
						mock_total_marks_subject_ary[element['subject_id']].push(question_pattern_ary[element['question_type']]);
					}
				}
			})
		})
		total_mock_subject = Object.keys(mock_total_marks_subject_ary).length;
		//////////////// Calculate Average against Subjects MOCK ///////////////////////////
		let mock_marks_avg_ary = [];
		let mocks_subject_marks = [];
		exist_record = 0;

		if(Object.keys(mock_total_marks_subject_ary).length > 0)
		{
			subjectary_mock.forEach(k=>{
				var sum = 0;
				let avg_value = 0;
				var sum2 = 0;
				if(mock_total_marks_subject_ary[k] != undefined){
					//sum = mock_total_marks_subject_ary[k].length;
					sum = mock_total_marks_subject_ary[k].reduce(function (x, y) {
					return x + y;
					}, 0);
			
				
				if(Object.keys(mock_right_marks_subject_ary).length > 0)
				{
					if(mock_right_marks_subject_ary[k] != undefined){
					//sum2 = mock_right_marks_subject_ary[k].length;
						sum2 = mock_right_marks_subject_ary[k].reduce(function (x, y) {
						return x + y;
						}, 0);
				}
			}
			if(sum2 > 0){
				avg_value = ((sum2/sum)*100);
			}
				mock_marks_avg_ary.push(avg_value);
				mocks_subject_marks.push(avg_value.toFixed(2));
				exist_record++;
				}else{
					mocks_subject_marks.push("0.00");
				}
		})		
	}
	

		i = 0;
		subjectnameary_mock.forEach(element=>{
			if(exist_record <= i){
				mock_marks_avg_ary.push(0);
			}
			i++;
		})

		let modck_marks_sum = mock_marks_avg_ary.reduce(function (x, y) {
			return parseFloat(x) + parseFloat(y);
			}, 0);
		let mock_overallavg = (modck_marks_sum/mock_marks_avg_ary.length).toFixed(2);
	

		finalary.series.push({"name":"Mock","data":mocks_subject_marks,"overall":mock_overallavg});
		//finalary.series[1]['data'] = module_marks_avg_ary;
		
		res.send({status:200,data:finalary});
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
module.exports = router;
