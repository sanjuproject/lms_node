const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const exam_scholastic = require('./exam_scholastic_subscribtion_master.js');
const exam_competitive = require('./exam_competitive_subscribtion_master.js');
const addtocart_subscription = require('./addtocart_subscription.js');
const purchased_subscribtions = require('./purchased_subscribtions.js');
const purchased_subscribtions_details = require('./purchase_subscribtion_details.js');
const exam_completed_archive = require('./exam_completed.js');
const helper = require('../helper.js');
const { config } = require('dotenv');
const configdata  = require('../config.js');
const db = require('./db.js');
const chapters = require('./chapters.js');


async function scholastic_getsubjectwise_chapters_service(req){
try{
    let board = req.user.board;
    let student_id = req.user.id;
    let subjectary = [];
    let subjectary_module = [];
    let subjectary_mock = [];
    let subjectnameary = [];
    let subjectnameary_module = [];
    let subjectnameary_mock = [];
    let overalavg = 0;
    let finalary = {};
    let group_subjects = "";
    let exam_type = req.body.exam_type;
    let group_subject_id = req.body.group_subject_id;
    await db.query("select exam_completed_archive.*,subjects.name as subject_name from exam_completed_archive left join subjects on subjects.id = exam_completed_archive.subject_id where student_id = "+student_id+" and exam_completed_archive.subject_group_id = "+group_subject_id+" group by exam_completed_archive.subject_id")
    .then(result=>{
        result.forEach(element=>{	
                subjectary.push(element['subject_id']);
                subjectnameary.push(element['subject_name']);
        
        })
    })

    await db.query("select exam_completed_archive.*,subjects.name as subject_name from exam_completed_archive left join subjects on subjects.id = exam_completed_archive.subject_id where exam_type = 2 and student_id = "+student_id+" and exam_completed_archive.subject_group_id = "+group_subject_id+" group by exam_completed_archive.subject_id")
    .then(result=>{
        result.forEach(element=>{	
                subjectary_module.push(element['subject_id']);
                subjectnameary_module.push(element['subject_name']);
        
        })
    })

    await db.query("select exam_completed_archive.*,subjects.name as subject_name from exam_completed_archive left join subjects on subjects.id = exam_completed_archive.subject_id where exam_type = 3 and student_id = "+student_id+" and exam_completed_archive.subject_group_id = "+group_subject_id+" group by exam_completed_archive.subject_id")
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
let right_marks_subject_chapter_ary = {};
let total_marks_subject_chapter_ary = {};
let right_marks = 0;
let total_marks = 0;

    await db.query("select online_exam_question_answers.post_ans_status,exam_completed_archive.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id,question_pattern.marks,questions.chapter_id from `exam_completed_archive` left join online_exam_question_answers on \
    online_exam_question_answers.exam_unique_id = exam_completed_archive.exam_unique_id left join questions on \
    questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type where `exam_category_id` = 1 and \
    exam_completed_archive.exam_type = 1 and exam_completed_archive.student_id = "+student_id+" and exam_completed_archive.subject_group_id = "+group_subject_id)
    .then(result=>{
        result.forEach(element=>{	
            if(element['post_ans_status'] == 1){
                if(right_marks_subject_ary[element['subject_id']] == null){
                    right_marks_subject_ary[element['subject_id']] = [];
                    right_marks_subject_ary[element['subject_id']].push(element['marks']);
                }else{
                    right_marks_subject_ary[element['subject_id']].push(element['marks']);
                }
            /////////////////////////////////////////////////////////////////////////////////////
                if(right_marks_subject_chapter_ary[element['subject_id']] == null){
                    right_marks_subject_chapter_ary[element['subject_id']] = [];
                    
                }
                if(right_marks_subject_chapter_ary[element['subject_id']][element['chapter_id']] == null){
                    right_marks_subject_chapter_ary[element['subject_id']][element['chapter_id']] = [];
                    right_marks_subject_chapter_ary[element['subject_id']][element['chapter_id']].push(element['marks']);
                }
                else{
                    right_marks_subject_chapter_ary[element['subject_id']][element['chapter_id']].push(element['marks']);
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

            /////////////////////////////////////////////////////////////////////////////////////

            if(total_marks_subject_chapter_ary[element['subject_id']] == null){
                total_marks_subject_chapter_ary[element['subject_id']]=[];				
            }
            if(total_marks_subject_chapter_ary[element['subject_id']][element['chapter_id']] == null){
                total_marks_subject_chapter_ary[element['subject_id']][element['chapter_id']]=[];				
                total_marks_subject_chapter_ary[element['subject_id']][element['chapter_id']].push(element['marks']);
            }
            else{
                if(question_pattern_ary[element['question_type']]!=''){
                    total_marks_subject_chapter_ary[element['subject_id']][element['chapter_id']].push(element['marks']);
                }
            }
        })
    })
    finalary.chapterary_total_marks = total_marks_subject_chapter_ary;
    finalary.chapterary_right_marks = right_marks_subject_chapter_ary;
    finalary.label = subjectnameary;
    //finalary.labels = [];
    //finalary.labels.push(subjectnameary);
    //finalary.labels.push(subjectnameary_module);
    //finalary.labels.push(subjectnameary_mock);
    finalary.series = [];
//////////////// Calculate Average against Subjects SET ///////////////////////////
let marks_avg_ary = [];
if(exam_type == 1){
let exist_record = 0;
if(Object.keys(total_marks_subject_ary).length > 0){
    subjectary.forEach(k=>{
        var sum = 0;
        var sum2 = 0; 
        let avg_value = 0;
        if(total_marks_subject_ary[k] != undefined){
            //sum = total_marks_subject_ary[k].length;
            sum = total_marks_subject_ary[k].reduce(function (x, y) {
                return parseFloat(x) + parseFloat(y);
                }, 0);
        }
        if(Object.keys(right_marks_subject_ary).length > 0){
            if(right_marks_subject_ary[k] != undefined){
            //sum2 = right_marks_subject_ary[k].length;	
            sum2 = right_marks_subject_ary[k].reduce(function (x, y) {
                return parseFloat(x) + parseFloat(y);
                }, 0);    
            }
    }
    if(sum2 > 0){
         avg_value = ((sum2/sum)*100).toFixed(2);
    }
        marks_avg_ary.push(avg_value);
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

//let set_overallavg = (set_marks_sum/marks_avg_ary.length).toFixed(2);

    finalary.series.push({"name":"Set","data":marks_avg_ary});
}
/////////////////////// MODULE EXAM Performance ///////////////////////////////
let module_right_marks_subject_ary = {};
let module_total_marks_subject_ary = {};

let module_right_marks = 0;
let module_total_marks = 0;
if(exam_type == 2){
    await db.query("select online_exam_question_answers.post_ans_status,exam_completed_archive.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed_archive` left join online_exam_question_answers on \
    online_exam_question_answers.exam_unique_id = exam_completed_archive.exam_unique_id left join questions on \
    questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and \
    exam_completed_archive.exam_type = 2 and exam_completed_archive.student_id = "+student_id+" and exam_completed_archive.subject_group_id = "+group_subject_id)
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
    let module_marks_avg_ary = [];
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
    }
        
        if(Object.keys( module_right_marks_subject_ary).length > 0){
            if(module_right_marks_subject_ary[k] != undefined){
                //sum2 = module_right_marks_subject_ary[k].length;
                sum2 = module_right_marks_subject_ary[k].reduce(function (x, y) {
                return x + y;
                }, 0);
            }
        }
        if(sum2 > 0){
            //console.log(sum2,"=====",sum);
            avg_value = ((sum2/sum)*100).toFixed(2);
        }
        module_marks_avg_ary.push(avg_value);
        exist_record++;
    });
}
 i = 0;
    subjectnameary_module.forEach(element=>{
        if(exist_record <= i){
            module_marks_avg_ary.push(0);
        }
        i++;
    })
    

    finalary.series.push({"name":"Module","data":module_marks_avg_ary});
}
    /////////////////////// MOCK EXAM Performance ///////////////////////////////
let mock_right_marks_subject_ary = {};
let mock_total_marks_subject_ary = {};

let mock_right_marks = 0;
let mock_total_marks = 0;
if(exam_type == 3){
    await db.query("select online_exam_question_answers.post_ans_status,exam_completed_archive.subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id from `exam_completed_archive` left join online_exam_question_answers on \
    online_exam_question_answers.exam_unique_id = exam_completed_archive.exam_unique_id left join questions on \
    questions.id = online_exam_question_answers.question_id where `exam_category_id` = 1 and \
    exam_completed_archive.exam_type = 3 and exam_completed_archive.student_id = "+student_id+" and exam_completed_archive.subject_group_id = "+group_subject_id)
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
    let mock_marks_avg_ary = [];
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
        }
            
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
            avg_value = ((sum2/sum)*100).toFixed(2);
        }
            mock_marks_avg_ary.push(avg_value);
            exist_record++;
        })		
}

    i = 0;
    subjectnameary_mock.forEach(element=>{
        if(exist_record <= i){
            mock_marks_avg_ary.push(0);
        }
        i++;
    })


    finalary.series.push({"name":"Mock","data":mock_marks_avg_ary});
    }
    return finalary;
}
    catch(err){
        console.error(`Error while getting programming languages `, err.message);
        next(err);
    }
}
async function scholastic_chapter_wise_marks(req){
    try{
        let board = req.user.board;
        let student_id = req.user.id;
        let right_marks_subject_ary = {};
		let total_marks_subject_ary = {};
        let total_marks_count = [];
        let right_marks_count = [];
        let finalary = {};
        await db.query("select online_exam_question_answers.post_ans_status,exam_completed_archive.branch_id as subject_id,questions.branch,questions.branch_id,questions.question_type,questions.id,question_pattern.marks,chapters.chapter_no from `exam_completed_archive` left join online_exam_question_answers on online_exam_question_answers.exam_unique_id = exam_completed_archive.exam_unique_id left join questions on questions.id = online_exam_question_answers.question_id left join question_pattern on question_pattern.short_code = questions.question_type  left join chapters on chapters.id = exam_completed_archive.chapter_id where exam_completed_archive.exam_category_id = 1 and exam_completed_archive.exam_type = 1 and exam_completed_archive.student_id = "+student_id+" and exam_completed_archive.chapter_id != 0").then(result=>{
			result.forEach(element=>{	
				if(element['post_ans_status'] == 1){
					if(right_marks_subject_ary[element['subject_id']] == null){
						right_marks_subject_ary[element['subject_id']] = [];
                        right_marks_count[element['subject_id']] = 0;
                    }
                    if(right_marks_subject_ary[element['subject_id']].element['chapter_no'] == null)
                    {
                        right_marks_subject_ary[element['subject_id']].element['chapter_no'] = [];
                    }
                    right_marks_subject_ary[element['subject_id']][element['chapter_no']] += 1;
                    right_marks_subject_ary[element['subject_id']][element['chapter_no']].push(element['marks']);

				}
				if(total_marks_subject_ary[element['subject_id']] == null){
					    total_marks_subject_ary[element['subject_id']]=[];
                        total_marks_count[element['subject_id']] = 0;	
                    }	
                    if(total_marks_subject_ary[element['subject_id']].element['chapter_no'] == null)
                    {
                        total_marks_subject_ary[element['subject_id']].element['chapter_no'] = [];
                    }	
                    total_marks_subject_ary[element['subject_id']].element['chapter_no'] += 1;	
                    total_marks_subject_ary[element['subject_id']].element['chapter_no'].push(element['marks']);		
				
			})
            finalary.total_marks_subject_ary = total_marks_subject_ary;
            finalary.right_marks_subject_ary = right_marks_subject_ary;
            finalary.total_marks_count = total_marks_count;
            finalary.right_marks_count = right_marks_count;
		})
        return finalary;
    }
    catch(err){
        console.error(`Error while getting programming languages `, err.message);
        next(err);
    }
}
module.exports = 
{
  scholastic_getsubjectwise_chapters_service,
  scholastic_chapter_wise_marks,
  //scholastic_module_wise_marks,
  //scholastic_mock_wise_marks
}