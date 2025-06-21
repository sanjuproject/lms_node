const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const cron = require('node-cron');
const moment = require('moment');
const db = require('../services/db');
const helper = require('../helper');
const configdata = require('../config');
const fs = require('fs');
const purchased_subscribtions = require('../services/purchased_subscribtions.js');
///reminder to student subscription for elibrary
	  const job = cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute() 
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		let library_notsubscribed_students = [];
        let already_subscribed_students = [];
		let response = "";
        await db.query("select * from `purchased_subscribtions` where is_active = 1")
        .then((result,err)=>{
            if(result.length > 0){
                result.forEach(element => {     
                    let subscription_details = JSON.parse(element.subscription_details);
                    subscription_details.forEach(element_inner=>{
                        if(element_inner.has_library == 1 || element_inner.only_elibrary == 1){
                            already_subscribed_students.push(element.student_id);
                        }
                    })
                })
                result.forEach(element => {     
                let subscription_details = JSON.parse(element.subscription_details);
                subscription_details.forEach(element_inner=>{
                     if(!already_subscribed_students.includes(element.student_id) && !library_notsubscribed_students.includes(element.student_id)){
                        library_notsubscribed_students.push(element.student_id);
                    }
                })
               });
            }
        });
		let students_details = [];
		await db.query("select * from `students` where `is_deleted` = 0 and `status` = 1")
		.then(result=>{
			if(result.length > 0){
				result.forEach(element=>{
					if(students_details[element.id] == null){
						students_details[element.id] = "";
					}
					students_details[element.id] = element;
				})
			}
		})
		for(let i=0;i<library_notsubscribed_students.length;i++){
			//console.log(students_details[library_notsubscribed_students[i]]);
				let reqest_data = {email:students_details[library_notsubscribed_students[i]].email,subject:configdata.subscriptionremindermail.subject,body:configdata.subscriptionremindermail.body}
			   helper.sendmail(reqest_data);
			}
	
	  });


	  const job2 = cron.schedule("0 0 * * *", async function jobYouNeedToExecute()  
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		let library_notsubscribed_students = [];
        let already_subscribed_students = [];
		var d = new Date();
		var today = new Date();
		var yesterday = new Date(today);
		
		yesterday.setDate(today.getDate() - 1);
		let new_date = yesterday.toISOString().split("T");
		let final_date_filter = new_date[0];
		let final_respose = [];
		let insert_query = [];
		let delete_query = [];
		await db.query("select * from `questions` where `updated_at` >= '"+final_date_filter+"'")
		.then(result=>{
			result.forEach(element=>{
				element.updated_at = element.updated_at.toISOString().slice(0,-1);
				element.created_at = element.created_at.toISOString().slice(0,-1);
				insert_query.push("INSERT INTO `questions`(`id`, `user_id`, `assigned_desiner`, `upload_id`, `exam_category`, `exam_type`, `exam_type_id`, `exam_subtype_id`, `exam_subtype`, `class`, `class_id`, `branch`, `branch_id`, `chapter`, `chapter_id`, `question_type`, `question_type_id`, `question_no`, `question`, `question_image`, `option_a`, `option_a_image`, `option_b`, `option_b_image`, `option_c`, `option_c_image`, `option_d`, `option_d_image`, `answer`, `reason`, `supporting_reason`, `status`, `demo_exam`, `is_approve`, `is_deleted`, `editor_type`, `option_a_editor_type`, `option_b_editor_type`, `option_c_editor_type`, `option_d_editor_type`, `reason_editor_type`, `css_group_id`, `created_at`, `updated_at`) VALUES ('"+element.id+"','"+element.user_id+"','"+element.assigned_desiner+"','"+element.upload_id+"','"+element.exam_category+"','"+element.exam_type+"','"+element.exam_type_id+"','"+element.exam_subtype_id+"','"+element.exam_subtype+"','"+element.class+"','"+element.class_id+"','"+element.branch+"','"+element.branch_id+"','"+element.chapter+"','"+element.chapter_id+"','"+element.question_type+"','"+element.question_type_id+"','"+element.question_no+"','"+element.question.replaceAll(/'/g, "\\'")+"','"+element.question_image+"','"+element.option_a.replaceAll(/'/g, "\\'")+"','"+element.option_a_image+"','"+element.option_b.replaceAll(/'/g, "\\'")+"','"+element.option_b_image+"','"+element.option_c.replaceAll(/'/g, "\\'")+"','"+element.option_c_image+"','"+element.option_d.replaceAll(/'/g, "\\'")+"','"+element.option_d_image+"','"+element.answer.replaceAll(/'/g, "\\'")+"','"+element.reason.replaceAll(/'/g, "\\'")+"','"+element.supporting_reason+"','"+element.status+"','"+element.demo_exam+"','"+element.is_approve+"','"+element.is_deleted+"','"+element.editor_type+"','"+element.option_a_editor_type+"','"+element.option_b_editor_type+"','"+element.option_c_editor_type+"','"+element.option_d_editor_type+"','"+element.reason_editor_type+"','"+element.css_group_id+"','"+element.created_at+"','"+element.updated_at+"')");

				delete_query.push("DELETE FROM `questions` WHERE id =  "+element.id);
			})
		})
		final_respose = {delete_query:delete_query,insert_query:insert_query};
		fs.openSync("migration_query/final_query.json",'w');
		fs.chmod("migration_query/final_query.json", 0o755, () => { 
			console.log("\nReading the file contents"); 
			console.log("\nTrying to write to file"); 
			try { 
			  fs.writeFileSync('migration_query/final_query.json', JSON.stringify(final_respose)); 
			  //console.log(final_respose);
			} 
			catch (e) { 
			  console.log("Error Code:", e.code); 
			} 
		})
res.send({status:200,msg:"Migrate data created"})
	
	  });

	  const job3 = cron.schedule("0 0 * * *", async function jobYouNeedToExecute() 
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		let library_notsubscribed_students = [];
        let already_subscribed_students = [];
		var d = new Date();
		var today = new Date();
		var yesterday = new Date(today);
		
		yesterday.setDate(today.getDate() - 1);
		let new_date = yesterday.toISOString().split("T");
		let final_date_filter = new_date[0];
		let final_respose = [];
		let insert_query = [];
		let delete_query = [];
		await db.query("select * from `e_library` where `updated_at` >= '"+final_date_filter+"'")
		.then(result=>{
			result.forEach(element=>{
				element.updated_at = element.updated_at.toISOString().slice(0,-1);
				element.created_at = element.created_at.toISOString().slice(0,-1);
				insert_query.push("INSERT INTO `e_library`(`id`, `user_id`, `exam_category_id`, `exam_type_id`, `exam_subtype_id`, `board_id`, `branch_id`, `class_id`, `chapter_id`, `zip_path`, `validator_zip`, `language_validator_zip`, `pdf_path`, `concept_map_path`, `write_up_pdfs`, `assigned_by`, `assigned_developer`, `assigned_desiner`, `assigned_validator`, `assigned_language_validator`, `status`, `admin_approved_status`, `is_deleted`, `is_demo`, `created_at`, `updated_at`) VALUES ("+element.id+",'"+element.user_id+"','"+element.exam_category_id+"','"+element.exam_type_id+"','"+element.exam_subtype_id+"','"+element.board_id+"','"+element.branch_id+"','"+element.class_id+"','"+element.chapter_id+"','"+element.zip_path+"','"+element.validator_zip+"','"+element.language_validator_zip+"','"+element.pdf_path+"','"+element.concept_map_path+"','"+element.write_up_pdfs+"','"+element.assigned_by+"','"+element.assigned_developer+"','"+element.assigned_desiner+"','"+element.assigned_validator+"','"+element.assigned_language_validator+"','"+element.status+"','"+element.admin_approved_status+"','"+element.is_deleted+"','"+element.is_demo+"','"+element.created_at+"','"+element.updated_at+"')");

				delete_query.push("DELETE FROM `e_library` WHERE id =  "+element.id);
			})
		})
		final_respose = {delete_query:delete_query,insert_query:insert_query};
		fs.openSync("migration_query/final_query_library.json",'w');
		fs.chmod("migration_query/final_query_library.json", 0o755, () => { 
			console.log("\nReading the file contents"); 
			console.log("\nTrying to write to file"); 
			try { 
			  fs.writeFileSync('migration_query/final_query_library.json', JSON.stringify(final_respose)); 
			  //console.log(final_respose);
			} 
			catch (e) { 
			  console.log("Error Code:", e.code); 
			} 
		})
res.send({status:200,msg:"Migrate data created for library"})
	
	  });


	  const job4 = cron.schedule("0 0 * * *", async function jobYouNeedToExecute() 
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		let library_notsubscribed_students = [];
        let already_subscribed_students = [];
		var d = new Date();
		var today = new Date();
		var yesterday = new Date(today);
		
		yesterday.setDate(today.getDate() - 1);
		let new_date = yesterday.toISOString().split("T");
		let final_date_filter = new_date[0];
		let final_respose = [];
		let insert_query = [];
		let delete_query = [];
		
		await db.query("select * from `event_history` where `updated_at` >= '"+final_date_filter+"'")
		.then(result=>{
			result.forEach(element=>{
				element.updated_at = element.updated_at.toISOString().slice(0,-1);
				element.created_at = element.created_at.toISOString().slice(0,-1);
				let regex = /'/g;
  			
				let sub_title = element.sub_title.replaceAll(regex, "");;
				let description = element.description.replaceAll(regex, "");;
				insert_query.push("INSERT INTO `event_history`(`id`, `event_date`, `sub_title`, `title`, `event_image`, `description`, `status`, `is_deleted`, `created_at`, `updated_at`) VALUES ("+element.id+",'"+element.event_date+"','"+sub_title+"','"+element.title+"','"+element.event_image+"','"+description+"','"+element.status+"','"+element.is_deleted+"','"+element.created_at+"','"+element.updated_at+"')");
				delete_query.push("DELETE FROM `event_history` WHERE id =  "+element.id);
			})
		})
		final_respose = {delete_query:delete_query,insert_query:insert_query};
		fs.openSync("migration_query/final_query_event.json",'w');
		fs.chmod("migration_query/final_query_event.json", 0o755, () => { 
			console.log("\nReading the file contents"); 
			console.log("\nTrying to write to file"); 
			try { 
			  fs.writeFileSync('migration_query/final_query_event.json', JSON.stringify(final_respose)); 
			  //console.log(final_respose);
			} 
			catch (e) { 
			  console.log("Error Code:", e.code); 
			} 
		})
res.send({status:200,msg:"Migrate data created for event history"})
	
	  });


	  const job5 = cron.schedule("0 0 * * *", async function jobYouNeedToExecute()
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		let library_notsubscribed_students = [];
        let already_subscribed_students = [];
		var d = new Date();
		var today = new Date();
		var yesterday = new Date(today);
		
		yesterday.setDate(today.getDate() - 1);
		let new_date = yesterday.toISOString().split("T");
		let final_date_filter = new_date[0];
		let final_respose = [];
		let insert_query = [];
		let delete_query = [];
		let trunc_query = [];
		trunc_query.push("truncate table `feedback_question`");
		await db.query("select * from `feedback_question` where 1")
		.then(result=>{
			result.forEach(element=>{
				element.updated_at = element.updated_at.toISOString().slice(0,-1);
				element.created_at = element.created_at.toISOString().slice(0,-1);
				let questions = element.questions.replaceAll(/'/g, "");
				
				insert_query.push("INSERT INTO `feedback_question`(`id`, `question_type`, `questions`, `status`, `created_at`, `updated_at`) VALUES ("+element.id+",'"+element.question_type+"','"+element.questions.replaceAll(/'/g, "")+"','"+element.status+"','"+element.created_at+"','"+element.updated_at+"')");

				//delete_query.push("DELETE FROM `feedback_question` WHERE id =  "+element.id);
			})
		})
		final_respose = {delete_query:trunc_query,insert_query:insert_query};
		fs.openSync("migration_query/feedback_question.json",'w');
		fs.chmod("migration_query/feedback_question.json", 0o755, () => { 
			console.log("\nReading the file contents"); 
			console.log("\nTrying to write to file"); 
			try { 
			  fs.writeFileSync('migration_query/feedback_question.json', JSON.stringify(final_respose)); 
			  //console.log(final_respose);
			} 
			catch (e) { 
			  console.log("Error Code:", e.code); 
			} 
		})
		res.send({status:200,msg:"Migrate data created for feedback question"})
	
	  });

	  const job6 = cron.schedule("0 0 * * *", async function jobYouNeedToExecute() 
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		
		var d = new Date();
		var today = new Date();
		var yesterday = new Date(today);
		
		yesterday.setDate(today.getDate() - 1);
		let new_date = yesterday.toISOString().split("T");
		let final_date_filter = new_date[0];
		let final_respose = [];
		let insert_query = [];
		let delete_query = [];
		await db.query("select * from `school_master` where `modified_at` >= '"+final_date_filter+"'")
		.then(result=>{
			result.forEach(element=>{
				element.updated_at = element.modified_at.toISOString().slice(0,-1);
				element.created_at = element.created_at.toISOString().slice(0,-1);
				insert_query.push("INSERT INTO `school_master`(`region`, `district`, `pincode`, `state_name`, `board`, `school_name`, `school_address`, `website`, `contact_number`, `alternate_contact_no`, `email`, `password`, `name_of_head`, `date_of_enrollment`, `affiliation_no`, `year_foundation`, `school_id`, `academic_year`, `affiliation_period_from`, `affiliate_preriod_to`, `school_status`, `is_deleted`, `created_at`, `modified_at`) VALUES ('"+element.region+"','"+element.district+"','"+element.pincode+"','"+element.state_name+"','"+element.board+"','"+element.school_name+"','"+element.school_address+"','"+element.website+"','"+element.contact_number+"','"+element.alternate_contact_no+"','"+element.email+"','"+element.password+"','"+element.name_of_head+"','"+element.date_of_enrollment+"','"+element.affiliation_no+"','"+element.year_foundation+"','"+element.school_id+"','"+element.academic_year+"','"+element.affiliation_period_from+"','"+element.affiliate_preriod_to+"','"+element.school_status+"','"+element.is_deleted+"','"+element.created_at+"','"+element.updated_at+"')");

				delete_query.push("DELETE FROM `school_master` WHERE id =  "+element.id);
			})
		})
		final_respose = {delete_query:delete_query,insert_query:insert_query};
		fs.openSync("migration_query/schoolmaster_question.json",'w');
		fs.chmod("migration_query/schoolmaster_question.json", 0o755, () => { 
			console.log("\nReading the file contents"); 
			console.log("\nTrying to write to file"); 
			try { 
			  fs.writeFileSync('migration_query/schoolmaster_question.json', JSON.stringify(final_respose)); 
			  //console.log(final_respose);
			} 
			catch (e) { 
			  console.log("Error Code:", e.code); 
			} 
		})
		res.send({status:200,msg:"Migrate data created for School Master"})
	
	  });

	  cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute() 
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		let library_notsubscribed_students = [];
        let already_subscribed_students = [];
		var d = new Date();
		var today = new Date();
		var yesterday = new Date(today);
		
		yesterday.setDate(today.getDate() - 1);
		let new_date = yesterday.toISOString().split("T");
		let final_date_filter = new_date[0];
		let final_respose = [];
		let insert_query = [];
		let delete_query = [];
		await db.query("select * from `e_library_subscription_master` where `updated_at` >= '"+final_date_filter+"'")
		.then(result=>{
			result.forEach(element=>{
				element.updated_at = element.updated_at.toISOString().slice(0,-1);
				element.created_at = element.created_at.toISOString().slice(0,-1);
				insert_query.push("INSERT INTO `e_library_subscription_master`(`id`, `subject_id`, `board_id`, `class`, `exam_category`, `exam_type_id`, `library_price`, `sticker_text`, `ranking_no`, `course_code`, `status`, `is_deleted`, `created_at`, `updated_at`) VALUES ("+element.id+","+element.subject_id+","+element.board_id+","+element.class+","+element.exam_category+","+element.exam_type_id+","+element.library_price+",'"+element.sticker_text+"',"+element.ranking_no+",'"+element.course_code+"',"+element.status+","+element.is_deleted+",'"+element.created_at+"','"+element.updated_at+"')");

				delete_query.push("DELETE FROM `e_library_subscription_master` WHERE id =  "+element.id);
			})
		})
		final_respose = {delete_query:delete_query,insert_query:insert_query};
		fs.openSync("migration_query/e_library_subscription_master.json",'w');
		fs.chmod("migration_query/e_library_subscription_master.json", 0o755, () => { 
			console.log("\nReading the file contents"); 
			console.log("\nTrying to write to file"); 
			try { 
			  fs.writeFileSync('migration_query/e_library_subscription_master.json', JSON.stringify(final_respose)); 
			  //console.log(final_respose);
			} 
			catch (e) { 
			  console.log("Error Code:", e.code); 
			} 
		})
		res.send({status:200,msg:"Migrate data created for e_library_subscription_master"})
	
	  });

	  cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute() 
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		let library_notsubscribed_students = [];
        let already_subscribed_students = [];
		var d = new Date();
		var today = new Date();
		var yesterday = new Date(today);
		
		yesterday.setDate(today.getDate() - 1);
		let new_date = yesterday.toISOString().split("T");
		let final_date_filter = new_date[0];
		let final_respose = [];
		let insert_query = [];
		let delete_query = [];
		
		await db.query("select * from `exam_scholastic_subscribtion_master` where `updated_at` >= '"+final_date_filter+"'")
		.then(result=>{
			result.forEach(element=>{
				element.updated_at = element.updated_at.toISOString().slice(0,-1);
				element.created_at = element.created_at.toISOString().slice(0,-1);
				insert_query.push("INSERT INTO `exam_scholastic_subscribtion_master`(`id`, `subject_id`, `board_id`, `class`, `package_details`, `sticker_text`, `status`, `ranking_no`, `course_code`, `is_deleted`, `created_at`, `updated_at`) VALUES ("+element.id+","+element.subject_id+","+element.board_id+","+element.class+",'"+element.package_details+"','"+element.sticker_text+"',"+element.status+","+element.ranking_no+",'"+element.course_code+"',"+element.is_deleted+",'"+element.created_at+"','"+element.updated_at+"')");

				delete_query.push("DELETE FROM `exam_scholastic_subscribtion_master` WHERE id =  "+element.id);
			})
		})
		final_respose = {delete_query:delete_query,insert_query:insert_query};
		fs.openSync("migration_query/exam_scholastic_subscribtion_master.json",'w');
		fs.chmod("migration_query/exam_scholastic_subscribtion_master.json", 0o755, () => { 
			console.log("\nReading the file contents"); 
			console.log("\nTrying to write to file"); 
			try { 
			  fs.writeFileSync('migration_query/exam_scholastic_subscribtion_master.json', JSON.stringify(final_respose)); 
			  //console.log(final_respose);
			} 
			catch (e) { 
			  console.log("Error Code:", e.code); 
			} 
		})
		res.send({status:200,msg:"Migrate data created for exam_scholastic_subscribtion_master"})
	
	  });

	  cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute() 
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		let library_notsubscribed_students = [];
        let already_subscribed_students = [];
		var d = new Date();
		var today = new Date();
		var yesterday = new Date(today);
		
		yesterday.setDate(today.getDate() - 1);
		let new_date = yesterday.toISOString().split("T");
		let final_date_filter = new_date[0];
		let final_respose = [];
		let insert_query = [];
		let delete_query = [];
		
		await db.query("select * from `exam_competitive_subscribtion_master` where `updated_at` >= '"+final_date_filter+"'")
		.then(result=>{
			result.forEach(element=>{
				element.updated_at = element.updated_at.toISOString().slice(0,-1);
				element.created_at = element.created_at.toISOString().slice(0,-1);
				insert_query.push("INSERT INTO `exam_competitive_subscribtion_master`(`id`, `class`, `exam_type_id`, `set_count`, `question_per_set`, `amount`, `library_price`, `sticker_text`, `status`, `ranking_no`, `course_code`, `created_at`, `updated_at`, `is_deleted`) VALUES ("+element.id+","+element.class+","+element.exam_type_id+","+element.set_count+","+element.question_per_set+","+element.amount+","+element.library_price+",'"+element.sticker_text+"',"+element.status+","+element.ranking_no+",'"+element.course_code+"','"+element.created_at+"','"+element.updated_at+"',"+element.is_deleted+")");

				delete_query.push("DELETE FROM `exam_competitive_subscribtion_master` WHERE id =  "+element.id);
			})
		})
		final_respose = {delete_query:delete_query,insert_query:insert_query};
		fs.openSync("migration_query/exam_competitive_subscribtion_master.json",'w');
		fs.chmod("migration_query/exam_competitive_subscribtion_master.json", 0o755, () => { 
			console.log("\nReading the file contents"); 
			console.log("\nTrying to write to file"); 
			try { 
			  fs.writeFileSync('migration_query/exam_competitive_subscribtion_master.json', JSON.stringify(final_respose)); 
			  //console.log(final_respose);
			} 
			catch (e) { 
			  console.log("Error Code:", e.code); 
			} 
		})
		res.send({status:200,msg:"Migrate data created for exam_competitive_subscribtion_master"})
	
	  });

	  cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute() 
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		let library_notsubscribed_students = [];
        let already_subscribed_students = [];
		var d = new Date();
		var today = new Date();
		var yesterday = new Date(today);
		
		yesterday.setDate(today.getDate() - 1);
		let new_date = yesterday.toISOString().split("T");
		let final_date_filter = new_date[0];
		let final_respose = [];
		let insert_query = [];
		let delete_query = [];
		
		await db.query("select * from `subjects` where `updated_at` >= '"+final_date_filter+"'")
		.then(result=>{
			result.forEach(element=>{
				element.updated_at = element.updated_at.toISOString().slice(0,-1);
				element.created_at = element.created_at.toISOString().slice(0,-1);
				if(element.subject_image != null){
				element.subject_image = element.subject_image.replace("clvdev.in","new.com").toString();
				}
				if(element.elibrary_image != null){
					element.elibrary_image = element.elibrary_image.replace("clvdev.in","new.com").toString();
				}
				insert_query.push("INSERT INTO `subjects`(`id`, `exam_category_id`, `exam_type_id`, `exam_subtype_id`, `board_id`, `group_exist`, `group_subjects`, `subject_code`, `name`, `subject_color_code`, `subject_image`, `elibrary_image`, `status`, `is_deleted`, `created_at`, `updated_at`) VALUES ("+element.id+","+element.exam_category_id+","+element.exam_type_id+","+element.exam_subtype_id+","+element.board_id+","+element.group_exist+",'"+element.group_subjects+"','"+element.subject_code+"','"+element.name+"','"+element.subject_color_code+"','"+element.subject_image+"','"+element.elibrary_image+"',"+element.status+","+element.is_deleted+",'"+element.created_at+"','"+element.updated_at+"')");

				delete_query.push("DELETE FROM `subjects` WHERE id =  "+element.id);
			})
		})

		final_respose = {delete_query:delete_query,insert_query:insert_query};
		fs.openSync("migration_query/subjects.json",'w');
		fs.chmod("migration_query/subjects.json", 0o755, () => { 
			console.log("\nReading the file contents"); 
			console.log("\nTrying to write to file"); 
			try { 
			  fs.writeFileSync('migration_query/subjects.json', JSON.stringify(final_respose)); 
			  //console.log(final_respose);
			} 
			catch (e) { 
			  console.log("Error Code:", e.code); 
			} 
		})
		res.send({status:200,msg:"Migrate data created for subjects"})
	
	  });

	  /*cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute() 
	  {
		// Do whatever you want in here. Send email, Make  database backup or download data.
		// Use moment.js or any other way to dynamically generate file name
		var d = new Date();
		var today = new Date();
		var yesterday = new Date(today);
		
		yesterday.setDate(today.getDate() - 90);
		let new_date = yesterday.toISOString().split("T");
		let final_date_filter = new_date[0];
		let final_respose = [];
		let insert_query = [];
		let delete_query = [];

		await db.query("select * from `chapters` where `updated_at` >= '"+final_date_filter+"'")
		.then(result=>{
			result.forEach(element=>{
				element.updated_at = element.updated_at.toISOString().slice(0,-1);
				element.created_at = element.created_at.toISOString().slice(0,-1);
				
				insert_query.push("INSERT INTO `chapters`(`id`,`exam_category_id`, `exam_board`, `board_id`, `sub_type`, `standard`, `chapter_name`, `chapter_no`, `short_code`, `sub_heading`, `branch_id`, `order_no`, `status`, `is_deleted`, `created_at`, `updated_at`) VALUES ('"+element.id+"','"+element.exam_category_id+"','"+element.exam_board+"','"+element.board_id+"','"+element.sub_type+"','"+element.standard+"','"+element.chapter_name+"','"+element.chapter_no+"','"+element.short_code+"','"+element.sub_heading+"','"+element.branch_id+"','"+element.order_no+"',"+element.status+","+element.is_deleted+",'"+element.created_at+"','"+element.updated_at+"')");

				delete_query.push("DELETE FROM `chapters` WHERE id =  "+element.id);
			})
		})

		final_respose = {delete_query:delete_query,insert_query:insert_query};
		fs.openSync("migration_query/chapters.json",'w');
		fs.chmod("migration_query/chapters.json", 0o755, () => { 
			console.log("\nReading the file contents"); 
			console.log("\nTrying to write to file"); 
			try { 
			  fs.writeFileSync('migration_query/chapters.json', JSON.stringify(final_respose)); 
			  //console.log(final_respose);
			} 
			catch (e) { 
			  console.log("Error Code:", e.code); 
			} 
		})
		res.send({status:200,msg:"Migrate data created for subjects"})
	
	  });*/

	  
//////////////////////////////////////// FOR ARCHIVE DATA //////////////////////////////////////////////
//router.get('/test_job3', async function jobYouNeedToExecute(req,res)
const expired_soon_sessions = cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute() 
	  {
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		
		await db.query("select academic_session.*,students.email,students.fname,students.id student_id from academic_session left join students on students.academic_year = academic_session.id where course_end_date > '"+current_date+"' and academic_session.is_expired = 1 and students.is_deleted = 0 and students.status = 1")
		.then(result=>{
			if(result.length > 0){
				result.forEach(async element=>{
					if(element.email !="" && element.email != null){
						let date_diff = Math.floor(await helper.calculate_date_diff(element.course_end_date));
			
						if(date_diff >= 15 && date_diff <= 30){	
							let mailbody = configdata.course_expired_soon.body.replace('#student#',element.fname);
							let expired_date = moment(element.course_end_date).format("MMMM D, YYYY");
								mailbody = mailbody.replace('#EXPIREDDATE#',expired_date);
								
							let reqest_data = {email:element.email,subject:configdata.course_expired_soon.subject,body:mailbody}
							helper.sendmail(reqest_data);
						}
					}
					
					
				})
				
			}
			res.send({status:200,msg:"Academic sessions expire soon."})
		})
	  })


	//	router.get('/test_job4', async function jobYouNeedToExecute(req,res)
	  const expired_sessions = cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute() 
	  {
		let current_date = moment(new Date()).format("YYYY-MM-DD");

		await db.query("select academic_session.*,students.email,students.fname,students.id student_id from academic_session left join students on students.academic_year = academic_session.id where course_end_date < '"+current_date+"' and academic_session.is_expired = 1 and students.is_deleted = 0 and students.status = 1")
		.then(result=>{
			if(result.length > 0){
				result.forEach(element=>{
					db.query("delete from logindevices where userid = "+element.student_id)
					let mailbody = configdata.course_expired.body.replace('#student#',element.fname);
					let reqest_data = {email:element.email,subject:configdata.course_expired.subject,body:mailbody}
					helper.sendmail(reqest_data);
				})
			}
		})
			await db.query("update academic_session set is_expired = 2 where course_end_date < '"+current_date+"'")
			.then(result=>{
				res.send({status:200,msg:"Old academic sessions expired and archived"})
			})
	  })

	  router.get('/archive_scholastic_exam/:id/:standard', async function jobYouNeedToExecute(req,res)
	  //const archive_scholastic_exam = cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute()
	  {
		let student_ids = []
		let exam_category = 0;
		let class_list = []
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		let last_seventh_date = moment().format("YYYY-MM-DD")+" 23:59:59";
		let student_id = req.params.id;
		let standard_id = req.params.standard;

			await db.query("select students.id as student_id, students.standard from students left join academic_session on academic_session.id = students.academic_year where academic_session.is_expired = 2 and academic_session.status = 1 and academic_session.is_deleted = 0")
			.then(result=>{
				if(result.length > 0){
					result.forEach(element=>{
						let student_id = element.student_id;
						let standard = element.standard;
						if(class_list[student_id] == null){
							class_list[student_id] = []
						}
						class_list[student_id] = standard;
						student_ids.push(student_id);
					})	
					//
				}
				//res.send({status:200,msg:"Old academic sessions expired and archived"})
			})
			if(student_ids[student_ids.length - 1] == undefined){
				student_ids = student_ids.pop();
			}
			student_ids = []
			student_ids.push(student_id);
			let exam_completed_ary = [];
if(student_ids.length > 0){
			await db.query("select * from exam_completed where student_id IN ("+student_ids.toString()+") and updated_at < '"+last_seventh_date+"'")
			.then(result=>{
				if(result.length > 0){
					result.forEach(element=>{
						exam_completed_ary.push(element);
				})
				}
			})
let insert_query = "INSERT INTO `exam_completed_archive`(`student_id`, `exam_unique_id`, `exam_category_id`, `exam_type`, `exam_set_counter`, `subject_group_id`, `subject_id`, `branch_id`, `chapter_id`, `sequence_no`, `exam_status`, `case_study_exam`, `previous_class`, `archive_data_status`) VALUES";
let insert_query_values = "";
let archive_record_ids = [];
			if(exam_completed_ary.length > 0){
				exam_completed_ary.forEach(async element=>{
							let student_id = element.student_id;
							let class_id = class_list[student_id];
							if(standard_id > 0)
							{
								class_id = standard_id
							}
							insert_query_values += "('"+student_id+"','"+element.exam_unique_id+"','"+element.exam_category_id+"','"+element.exam_type+"','"+element.exam_set_counter+"','"+element.subject_group_id+"','"+element.subject_id+"','"+element.branch_id+"','"+element.chapter_id+"','"+element.sequence_no+"','"+element.exam_status+"','"+element.case_study_exam+"','"+class_id+"',1)";
							insert_query_values +=",";
							archive_record_ids.push(element.id);
							})

							await db.query(insert_query+insert_query_values.slice(0, -1));
							await db.query("delete from exam_completed where id IN ("+archive_record_ids.toString()+")");
			}
			//////////////////// Library SESTION ///////////////////////////////
			let library_access_ary = [];
			await db.query("select * from elibrary_access_log where student_id IN ("+student_ids.toString()+") and created_at < '"+last_seventh_date+"'")
			.then(result=>{
				if(result.length > 0){
					result.forEach(element=>{
						library_access_ary.push(element);
					})
				}
			})
			insert_query = "INSERT INTO `elibrary_access_log_archive`(`student_id`, `subject_id`, `chapter_shortcode`, `time_spend`, `previous_class`, `archive_data_status`) VALUES ";
			insert_query_values = "";
			archive_record_ids = [];

			if(library_access_ary.length > 0){
				library_access_ary.forEach(async element => {
					let student_id = element.student_id;
					let class_id = class_list[student_id];
					if(standard_id > 0)
						{
							class_id = standard_id
						}
							insert_query_values += "('"+student_id+"','"+element.subject_id+"','"+element.chapter_shortcode+"','"+element.time_spend+"','"+class_id+"',1)";
							insert_query_values +=",";
							archive_record_ids.push(element.id);
							})

							await db.query(insert_query+insert_query_values.slice(0, -1));
							await db.query("delete from elibrary_access_log where id IN ("+archive_record_ids.toString()+")");
						}
					/*===================================*/
						let library_visit_ary = [];
						await db.query("select * from elibrary_visit_log where student_id IN ("+student_ids.toString()+") and created_at < '"+last_seventh_date+"'")
						.then(result=>{
							if(result.length > 0){
								result.forEach(element=>{
									library_visit_ary.push(element);
								})
							}
						})
						insert_query = "INSERT INTO `elibrary_visit_log_archive`( `student_id`, `subject_id`, `chapter_id`, `archive_data_status`, `previous_class`) VALUES ";
						insert_query_values = "";
						archive_record_ids = [];
						let class_id = class_list[student_id];
						if(standard_id > 0)
							{
								class_id = standard_id
							}
						if(library_visit_ary.length > 0){
							library_visit_ary.forEach(async element => {
								let student_id = element.student_id;
										insert_query_values += "('"+student_id+"','"+element.subject_id+"','"+element.chapter_shortcode+"',1,'"+class_id+"')";
										insert_query_values +=",";
										archive_record_ids.push(element.id);
										})
			
										await db.query(insert_query+insert_query_values.slice(0, -1));
										await db.query("delete from elibrary_visit_log where id IN ("+archive_record_ids.toString()+")");
									}
			/*/============================================*/
									let search_question_ary = [];
									await db.query("select * from searched_questions where student_id IN ("+student_ids.toString()+") and created_at < '"+last_seventh_date+"'")
									.then(result=>{
										if(result.length > 0){
											result.forEach(element=>{
												search_question_ary.push(element);
											})
										}
									})
									insert_query = "INSERT INTO `searched_questions_archive`( `student_id`, `subject_id`, `search_text`, `previous_class`, `archive_data_status`) VALUES";
									insert_query_values = "";
									archive_record_ids = [];
						
									if(search_question_ary.length > 0){
										search_question_ary.forEach(async element => {
											let student_id = element.student_id;
											let class_id = class_list[student_id];
											if(standard_id > 0)
												{
													class_id = standard_id
												}
													insert_query_values += "('"+student_id+"','"+element.subject_id+"','"+element.search_text+"','"+class_id+"',1)";
													insert_query_values +=",";
													archive_record_ids.push(element.id);
													})
						
													await db.query(insert_query+insert_query_values.slice(0, -1));
													await db.query("delete from searched_questions where id IN ("+archive_record_ids.toString()+")");
												}
		}
			/////////////////////////////////////////////////
			res.send({status:200,msg:"Old exam data archived"})
	  })
	router.get('/achive_competitve_exam/:id/:standard', async function jobYouNeedToExecute(req,res) 
	//const archive_competitve_exam = cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute()
	  {
		let student_ids = []
		let exam_category = 0;
		let exam_type_list = [];
		let class_list = [];
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		let last_seventh_date = moment().format("YYYY-MM-DD")+" 23:59:59";
		let student_id = req.params.id;
		let standard_id = req.params.standard;

		//////////////////// EXAM SESTION ///////////////////////////////
		await db.query("SELECT * from academic_session where exam_category_id = 2 and is_deleted = 0 and is_expired = 2 and status = 1")
			.then(result=>{
				if(result.length > 0){
					result.forEach(element=>{
						exam_type_list.push(element.exam_board_type);
					})	
				}
			})
	if(exam_type_list.length > 0){		
		await db.query("select students.id as student_id, students.standard from students left join academic_session on academic_session.id = students.academic_year where academic_session.is_expired = 2 and academic_session.status = 1 and academic_session.is_deleted = 0")
		.then(result=>{
			if(result.length > 0){
				result.forEach(element=>{
					let student_id = element.student_id;
					let standard = element.standard;
					if(class_list[student_id] == null){
						class_list[student_id] = []
					}
					class_list[student_id] = standard;
					student_ids.push(student_id);
				})	
				//
			}
			//res.send({status:200,msg:"Old academic sessions expired and archived"})
		})
		if(student_ids[student_ids.length - 1] == undefined){
			student_ids = student_ids.pop();
		}
		student_ids = []
		student_ids.push(student_id);
			let exam_completed_competitive_ary = [];
			await db.query("select * from exam_completed_competitive where student_id IN ("+student_ids.toString()+") and updated_at < '"+last_seventh_date+"'")
			.then(result=>{
				if(result.length > 0){
					result.forEach(element=>{
						exam_completed_competitive_ary.push(element);
				})
				}
			})
let insert_query = "INSERT INTO `exam_completed_competitive_archive`(`student_id`, `exam_type`, `exam_subtype_id`, `subscription_id`, `exam_unique_id`, `exam_category_id`, `exam_set_counter`, `total_attempts`, `previous_class`, `archive_data_status`) VALUES ";
let insert_query_values = "";
let archive_record_ids = [];
			if(exam_completed_competitive_ary.length > 0){
				exam_completed_competitive_ary.forEach(async element=>{
							let student_id = element.student_id;
							let class_id = class_list[student_id];
							if(standard_id > 0)
							{
								class_id = standard_id
							}
							insert_query_values += "('"+student_id+"','"+element.exam_type+"','"+element.exam_subtype_id+"','"+element.subscription_id+"','"+element.exam_unique_id+"','"+element.exam_category_id+"','"+element.exam_set_counter+"','"+element.total_attempts+"','"+class_id+"',1)";
							insert_query_values +=",";
							archive_record_ids.push(element.id);
							
							})
							if(archive_record_ids[archive_record_ids.length - 1] == undefined){
								archive_record_ids = archive_record_ids.pop();
							}
							await db.query(insert_query+insert_query_values.slice(0, -1));
							await db.query("delete from exam_completed_competitive where id IN ("+archive_record_ids.toString()+")");
			}
			/////////////////////////////////////////////////
		}
		
			res.send({status:200,msg:"Old exam data archived"})
	  })

	  router.get('/delete_old_subscriptions', async function jobYouNeedToExecute(req,res) 
	//const archive_competitve_exam = cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute()
	  {
		let student_ids = []
		let exam_category = 0;
		let exam_type_list = [];
		let class_list = [];
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		let last_seventh_date = moment().format("YYYY-MM-DD")+" 23:59:59";

		//////////////////// EXAM SESTION ///////////////////////////////
		await db.query("select students.id as student_id from students left join academic_session on academic_session.id = students.academic_year where academic_session.exam_category_id = 1 and academic_session.is_deleted = 0 and academic_session.status = 1 and academic_session.course_end_date < '"+last_seventh_date+"'")
			.then(result=>{
				if(result.length > 0){
					result.forEach(async element=>{
						await db.query("delete from purchased_subscribtions where student_id = "+element.student_id)
						await db.query("delete from purchased_subscribtions_details where student_id = "+element.student_id)
					})	
				}
			})
	
		
			res.send({status:200,msg:"Old exam data archived"})
	  })


	  router.get('/archive_purchase/:id/:standard', async function jobYouNeedToExecute(req,res) 
	//const archive_competitve_exam = cron.schedule("0 0 0 * * *", async function jobYouNeedToExecute()
	  {
		let student_ids = []
		let exam_category = 0;
		let purchased_data = []
		let purchased_details = []
		let class_list = [];
		let current_date = moment(new Date()).format("YYYY-MM-DD");
		let last_seventh_date = moment().format("YYYY-MM-DD")+" 23:59:59";
		let student_id = req.params.id;
		let standard = 0;
		let standard_id = req.params.standard;
		await db.query("select * from `students` where id = "+student_id)
		.then(result=>{
			if(result.length > 0){
				result.forEach(element=>{
					standard = element.standard;
				})	
			}
		})
		//////////////////// EXAM SESTION ///////////////////////////////
		await db.query("SELECT * from purchased_subscribtions where student_id = "+student_id)
			.then(result=>{
				if(result.length > 0){
					result.forEach(element=>{
						element.previous_class = standard;
						purchased_data.push(element);
					})	
				}
			})
	if(purchased_data.length > 0){		
		await db.query("select * from purchased_subscribtions_details where student_id = "+student_id)
		.then(result=>{
			if(result.length > 0){
				result.forEach(element=>{
					
					let standard = element.standard;
					element.previous_class = standard;
					purchased_details.push(element);
					
				})	
				//
			}
			//res.send({status:200,msg:"Old academic sessions expired and archived"})
		})
		
		
let insert_query = "INSERT INTO `purchased_subscribtions_details_archive`(`student_id`, `subscribtion_payment_trans_id`, `exam_category_id`, `class`, `exam_type_id`, `subscription_id`, `no_set`, `no_module`, `no_mock`, `no_casestudy`, `cart_amount`, `category`, `category_short_code`, `type_name`, `board_name`, `subject_name`, `subject_id`, `has_library`, `only_elibrary`, `online_class`, `subscribe_method`, `previous_class`) VALUES ";
let insert_query_values = "";
let archive_record_ids = [];
			if(purchased_details.length > 0){
				purchased_details.forEach(async element=>{
							let student_id = element.student_id;
							if(standard_id > 0)
								{
									previous_class = standard_id
								}
							insert_query_values += "('"+student_id+"','"+element.subscribtion_payment_trans_id+"','"+element.exam_category_id+"','"+element.class+"','"+element.exam_type_id+"','"+element.subscription_id+"','"+element.no_set+"','"+element.no_module+"','"+element.no_mock+"','"+element.no_casestudy+"','"+element.cart_amount+"','"+element.category+"','"+element.category_short_code+"','"+element.type_name+"','"+element.board_name+"','"+element.subject_name+"','"+element.subject_id+"','"+element.has_library+"','"+element.only_elibrary+"','"+element.online_class+"','"+element.subscribe_method+"','"+previous_class+"')";
							insert_query_values +=",";
							archive_record_ids.push(element.id);
							
							})
							if(archive_record_ids[archive_record_ids.length - 1] == undefined){
								archive_record_ids = archive_record_ids.pop();
							}
						
							await db.query(insert_query+insert_query_values.slice(0, -1));
							await db.query("delete from purchased_subscribtions_details where student_id = "+student_id);
			}
			/////////////////////////////////////////////////

			let insert_query2 = "INSERT INTO `purchased_subscribtions_archive`(`student_id`, `subscription_details`, `subscribtion_payment_trans_id`, `exam_unique_id`, `is_active`, `previous_class`) VALUES ";
let insert_query_values2 = "";
let archive_record_ids2 = [];
			if(purchased_data.length > 0){
				purchased_data.forEach(async element=>{
							let student_id = element.student_id;
							if(standard_id > 0)
								{
									previous_class = standard_id
								}
							insert_query_values2 += "('"+student_id+"','"+element.subscription_details+"','"+element.subscribtion_payment_trans_id+"','"+element.exam_unique_id+"','1','"+previous_class+"')";
							insert_query_values2 +=",";
							archive_record_ids2.push(element.id);
							
							})
							if(archive_record_ids2[archive_record_ids2.length - 1] == undefined){
								archive_record_ids2 = archive_record_ids2.pop();
							}
							await db.query(insert_query2+insert_query_values2.slice(0, -1));
							await db.query("delete from purchased_subscribtions where student_id = "+student_id);
			}
			/////////////////////////////////////////////////

		}
		
			res.send({status:200,msg:"Old exam data archived"})
	  })

module.exports = router;