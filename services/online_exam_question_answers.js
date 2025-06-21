const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const branchdata = require('./branches.js');
const chapterdata = require('./chapters.js');

async function storeonlineexamanswer(data)
{
    try{
        let branch = data[0].branch;
        let total_attempt = data[0].total_attempt;
        let chapterno = data[0].chapter;
        let exam_type = parseInt(data.exam_type);
        let board_id = data[0].user_data.board;
        let finalno = chapterno.match(/\d+/g);
        let chapter_code = "CH"+(finalno[1]);
        let branch_id = 0;
        let chapter_id = "";
        let subject_id = 0;
        let exam_category_id = "";
    
        
        if(data[0].chapter!='CH0')
        {
            await branchdata.getbranchbycode(branch,board_id)
            .then((branch_data)=>{
            branch_id = branch_data.data[0].id;
            subject_id = data[0].subject_id;
         }) 
    
            await chapterdata.getchapterbycode(chapterno)
            .then(async chapter_data=>{
        
            chapter_id = chapter_data.data[0].id;
            exam_category_id = 1;
            
            let querystringans = "";
            let querystringans_value = "";
            let response = {};
            let swa_count = 0;
            let hot_count =0;
            let des_count = 0;    
                    querystringans = "INSERT INTO `online_exam_question_answers`(`student_id`,`exam_unique_id`, `question_id`, `question_no`, `post_ans`, `post_ans_status`) VALUES";
                    data.forEach(element => {
                        querystringans_value += "('"+element.student_id+"','"+element.exam_unique_id+"','"+element.question_id+"','"+element.question_no+"','"+element.guest_post_ans+"','"+element.guest_post_ans_status+"'),"
                        if(element.question_type == 'SWA' && element.guest_post_ans_status == 1){
                            swa_count += 1;
                        } 
                        else if((element.question_type == 'HOTS' || element.question_type == 'HOT') && element.guest_post_ans_status == 1){
                            hot_count += 1;
                        } 
                        else if(element.question_type == 'DES' && element.guest_post_ans_status == 1){
                            des_count += 1;
                        } 
                    });
                if(exam_type > 1){    
                    await db.query("select * from `exam_chapter_interm_store` where `student_id` = "+data[0].student_id+" and `subject_id` = "+subject_id)
                    .then(result=>{
                        chapter_id = result[0].chapters;
                    })
                }
                
                    await db.query("INSERT INTO `exam_performance_scholastic`(`student_id`,`exam_unique_id`,`chapter`,`chapter_id`, `question_type_swa`, `question_type_hot`, `question_type_des`, `subject_id`, `set_no`) \
                    VALUES ("+data[0].student_id+",'"+data[0].exam_unique_id+"','"+chapterno+"',"+chapter_id+","+swa_count+","+hot_count+","+des_count+","+subject_id+","+data[0].exam_set_counter+")");
                   // console.log(querystringans+querystringans_value.slice(0,-1));
                        await db.query(querystringans+querystringans_value.slice(0,-1)); // Insert multiple record against a single query
                        //db.query(querystringans);
                        
                        await db.query("INSERT INTO `exam_completed`(`student_id`, `exam_unique_id`,`exam_category_id`, `exam_type`,`exam_set_counter`,`subject_group_id`,`subject_id`,`branch_id`,`chapter_id`,`sequence_no`,`case_study_exam`) \
                        VALUES("+data[0].student_id+",'"+data[0].exam_unique_id+"',"+exam_category_id+","+data[0].exam_type+","+data[0].exam_set_counter+","+data[0].group_subject_id+","+subject_id+","+branch_id+","+chapter_id+","+total_attempt+","+data[0].case_study_exam+")");
                        
                        if(exam_type > 1)
                        {     
                                await db.query("select * from `exam_chapter_interm_store` where `student_id` = "+data[0].student_id +" and `subject_id` = "+subject_id+" order by id desc")
                                .then(async result=>{
                                    
                                    if(result.length > 0){
                                        chapter_ary = result[0].chapters;
                                    
                                        await db.query("update `exam_completed` set chapter_id = '"+chapter_ary+"',sequence_no = "+total_attempt+" where `exam_unique_id` = '"+data[0].exam_unique_id+"' and `exam_set_counter` = "+data[0].exam_set_counter+" and `student_id` = "+data[0].student_id+" and `subject_id` = "+subject_id+" and `exam_type` = "+data[0].exam_type+" and `subject_group_id` = "+data[0].group_subject_id+"")
                                        await db.query("delete from exam_chapter_interm_store where `student_id` = "+data[0].student_id)
                                        
                                    }
                                })
                        }
                        
                        response = data[0].student_id;
                            return response;
                        })
        }else{
            chapter_id = 0;
            exam_category_id = 1;
            let querystringans = "";
            let querystringans_value = "";
            subject_id = data[0].subject_id;
            let response = {};
            let questionsary = [];
                    querystringans = "INSERT INTO `online_exam_question_answers`(`student_id`,`exam_unique_id`, `question_id`, `question_no`, `post_ans`, `post_ans_status`) VALUES";
                    data.forEach(element => {
                        questionsary.push(element.question_id);
                        querystringans_value += "('"+element.student_id+"','"+element.exam_unique_id+"','"+element.question_id+"','"+element.question_no+"','"+element.guest_post_ans+"','"+element.guest_post_ans_status+"'),"
                    });
                   // console.log(querystringans+querystringans_value.slice(0,-1));
                        await db.query(querystringans+querystringans_value.slice(0,-1));
                        //db.query(querystringans);
                        let chapter_ary = [];
                        //console.log("select chapter_id from `questions` where `id` in ("+questionsary+") group by chapter_id")
                        await db.query("select chapter_id from `questions` where `id` in ("+questionsary+") group by chapter_id")
                        .then(respone=>{
                            respone.forEach(element=>{
                                chapter_ary.push(element['chapter_id'])
                            })
                        })
           
                        await db.query("INSERT INTO `exam_completed`(`student_id`, `exam_unique_id`,`exam_category_id`, `exam_type`,`exam_set_counter`,`subject_group_id`,`subject_id`,`branch_id`,`chapter_id`,`sequence_no`,`case_study_exam`) \
                        VALUES("+data[0].student_id+",'"+data[0].exam_unique_id+"','"+exam_category_id+"',"+data[0].exam_type+","+data[0].exam_set_counter+","+data[0].group_subject_id+","+subject_id+","+branch_id+",'"+chapter_ary+"',"+total_attempt+","+data[0].case_study_exam+")");

                        await db.query("select * from `exam_chapter_interm_store` where `student_id` = "+data[0].student_id +" order by id desc")
                        .then(async result=>{
                            //console.log(result);
                            if(result.length > 0){
                                chapter_ary = result[0].chapters;
                
                                //await db.query("update `exam_completed` set chapter_id = '"+chapter_ary+"' where `exam_set_counter` = "+data[0].exam_set_counter+" and `student_id` = "+data[0].student_id+" and `subject_id` = "+subject_id+" and `exam_type` = "+data[0].exam_type)
                        
                                await db.query("update `exam_completed` set chapter_id = '"+chapter_ary+"',sequence_no = "+total_attempt+" where `exam_unique_id` = '"+data[0].exam_unique_id+"' and `exam_set_counter` = "+data[0].exam_set_counter+" and `student_id` = "+data[0].student_id+" and `subject_id` = "+subject_id+" and `exam_type` = "+data[0].exam_type+" and `subject_group_id` = "+data[0].group_subject_id+"")
                                await db.query("delete from exam_chapter_interm_store where `student_id` = "+data[0].student_id)
                                
                            }
                        })
                            response = data[0].student_id;
                            return response;
        }
        
    }
    catch(err)
    {
        response = {status:config.errorStatus,msg:"Store ans fail",error:err}
        return response;
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////

async function storeonlineexamanswer_competitive(data)
{
    try{
        
        let exam_type = data[0].exam_type;
        let exam_subtype = data[0].exam_subtype;
        let exam_category_id = 2;
            let querystringans = "";
            let querystringans_value = "";
            let response = {};
       
                    querystringans = "INSERT INTO `online_exam_question_answers_competitive`(`student_id`,`exam_type`,`exam_subtype_id`,`subscription_id`,`exam_unique_id`, `question_id`, `question_no`, `post_ans`, `post_ans_status`) VALUES";
                    data.forEach(element => {
                        querystringans_value += "('"+element.student_id+"','"+exam_type+"','"+exam_subtype+"','"+element.subscription_id+"','"+element.exam_unique_id+"','"+element.question_id+"','"+element.question_no+"','"+element.guest_post_ans+"','"+element.guest_post_ans_status+"'),"
                    });
                    //console.log(querystringans+querystringans_value.slice(0,-1));
                        await db.query(querystringans+querystringans_value.slice(0,-1));
                        //db.query(querystringans);


                        await db.query("INSERT INTO `exam_completed_competitive`(`student_id`,`exam_type`,`exam_subtype_id`,`subscription_id`, `exam_unique_id`,`exam_category_id`,`exam_set_counter`) \
                        VALUES("+data[0].student_id+",'"+exam_type+"','"+exam_subtype+"','"+data[0].subscription_id+"','"+data[0].exam_unique_id+"','"+exam_category_id+"',"+data[0].exam_set_counter+")");
                            response = data[0].student_id;
                            return response;
                    
     
        
    }
    catch(err)
    {
        response = {status:config.errorStatus,msg:"Store ans fail",error:err}
        return response;
    }
}

module.exports = {
    storeonlineexamanswer,
    storeonlineexamanswer_competitive
}