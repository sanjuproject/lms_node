const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin.js');
const e_library = require('../services/elibrary.js');
const chapters = require('../services/chapters.js');
const subjects = require('../services/subjects.js');
const elibraryaccesslog = require('../services/elibrary_access_log.js');
const db = require('../services/db.js');
var CryptoJS = require("crypto-js");

//Get e-Library content details against diffarent classes,board,subject, and chapter
router.post('/getelibrarycontent', async function(req,res,next){
    try{
		res.send({msg:"msg"})
		res.json(await e_library.getconceptmapdetails(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get purchased e-Library content details against a student or user
router.post('/getpurchasedelibrarycontent',adminMiddleware.validateToken, async function(req,res,next){
    try{
		res.json(await e_library.get_e_library_conceptmapdetails(req.body,req.user));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// get all chapters list against subject
router.post('/getchaptersbybranch', adminMiddleware.validateToken, async function(req,res,next){
    try{
		res.json(await chapters.getchaptersbybranch(req.body));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Get all subjects list against student and board
router.post('/getsubjectlist', adminMiddleware.validateToken, async function(req,res,next){
    try{
		let userdata = req.user;
		res.json(await subjects.getsubjectsbycategory(req.body,userdata));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Store library time spend by a student against a particular subject chapter
router.post('/storeelibrarytimespend', adminMiddleware.validateToken, async function(req,res,next){
    try{
		let userdata = req.user;
		res.json(await elibraryaccesslog.storeelibraryaccesslog(req.body,userdata));
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Store library visit by a student against a particular subject chapter
router.post('/storeelibraryvisit', adminMiddleware.validateToken, async function(req,res,next){
    try{
		let userdata = req.user;
		
		await db.query("INSERT INTO `elibrary_visit_log`(`student_id`,`subject_id`, `chapter_id`) VALUES("+userdata.id+","+req.body.subject_id+",'"+req.body.chapter_shortcode+"')")
		.then(result=>{
			res.status(200).send({status:200,msg:"e-Library visit record stored"});
		})
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});
// Check e-Library subscription exist or not against a particular student
router.post('/checkelibrarysubscription_exist', adminMiddleware.validateToken, async function(req,res,next){
    try{
		let userid = 0;
		if(req.user != undefined || req.user != null)
			{
				userid = req.user.id;
			}
		let pdfpath = req.body.pdfpath;
		let Subscriped_subjects_library = [];
		let Subscriped_com_library = [0];
		let response = "";
		let non_group_subjects_list = [0];
		/////////////// Check Subscription Status //////////////////
		const myPromise1 = new Promise(async(resolve, reject) => {
		await db.query("select * from `purchased_subscribtions_details` where `student_id` = "+userid+" and (has_library = 1 or only_elibrary = 1)")
		.then(async result=>{
			if(result.length > 0)
			{
				result.forEach(Element=>{
					if(Element.subject_id != 0)
						Subscriped_subjects_library.push(Element.subject_id);
					if(Element.exam_category_id == 2){
						Subscriped_com_library.push(Element.exam_type_id);
					}
				})
			}
		})
		resolve(Subscriped_subjects_library);
	});
	myPromise1.then(async data=>{
		let subjects_ary_list = [];
		await db.query("select * from `subjects` where `is_deleted` = 0 and status = 1")
		.then(result=>{
			if(result.length > 0){
				result.forEach(Element=>{
					if(subjects_ary_list[Element.id] == null)
					{
						subjects_ary_list[Element.id] = [];
					}
					if(Element.group_exist == 1){
						subjects_ary_list[Element.id] = Element.group_subjects.split(",");
					}
					else if(Element.group_exist == 2){
						subjects_ary_list[Element.id] = [Element.id];
					}
					if(Element.group_exist == 3){
						subjects_ary_list[Element.id] = Element.group_subjects.split(",");
					}
				})
			}
		})
		data.forEach(async Element=>{
			subjects_ary_list[Element].forEach(Element_inner=>{	
								non_group_subjects_list.push(parseInt(Element_inner));
							})
			
			})
			let search_filepath = pdfpath.split("#")[0];
			search_filepath = search_filepath.split("/").pop();
		

			await db.query("select * from `e_library` where is_demo = 2 and is_deleted = 0 and status = 1 and (`pdf_path` LIKE '%"+search_filepath+"%' OR `concept_map_path` LIKE '%"+search_filepath+"%')")
			.then(async result=>{
				if(result.length > 0)
				{
					await db.query("select * from `e_library` where is_demo = 2 and exam_category_id = 1 and branch_id IN("+non_group_subjects_list+") and is_deleted = 0 and status = 1 and (`pdf_path` LIKE '%"+search_filepath+"%' OR `concept_map_path` LIKE '%"+search_filepath+"%')")
					.then(async result=>{
						if(result.length > 0)
						{
							response = {status:200,msg:"e-Library file exist Sch",exist:1};
						}
						else{
							await db.query("select * from `e_library` where is_demo = 2 and exam_category_id = 2 and is_deleted = 0 and status = 1 and exam_type_id IN ("+Subscriped_com_library+") and (`pdf_path` LIKE '%"+search_filepath+"%' OR `concept_map_path` LIKE '%"+search_filepath+"%')")
							.then(result2 =>{
								if(result2.length > 0)
								{
									response = {status:200,msg:"e-Library file exist com",exist:1};
								}else{
									response = {status:410,msg:"e-Library file not exist",exist:2,filepath:search_filepath};
								}
							})
						}
					})
				}else{
					await db.query("select * from `e_library` where is_demo != 2 and is_deleted = 0 and status = 1 and (`pdf_path` LIKE '%"+search_filepath+"%' OR `concept_map_path` LIKE '%"+search_filepath+"%')")
					.then(async result=>{
						if(result.length > 0)
								{
									response = {status:200,msg:"e-Library Demo File exist",exist:1};
								}
								else{
									response = {status:410,msg:"e-Library file not exist",exist:2,filepath:search_filepath};
								}
					})
				}
				})
			res.status(200).send(response);	
	})
		///////////////////////////////////////////////////////////
		
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});


///////////////////////////////eLibrary AWS Access Credentials Details //////////////////////
// Access eLibrary AWS Access Credentials Details
router.get('/aws_credentials_details', adminMiddleware.validateToken, async function(req,res,next){
    try{
		let ACCESSKEYID = CryptoJS.AES.encrypt(process.env.ACCESSKEYID, process.env.CRYPTO).toString();
		let SECRETACCESSKEY = CryptoJS.AES.encrypt(process.env.SECRETACCESSKEY, process.env.CRYPTO).toString();
		res.status(200).send({status:200,msg:"AWS Credentials Details",ACCESSKEYID:ACCESSKEYID,SECRETACCESSKEY:SECRETACCESSKEY});
	}
	catch(err){
		console.error(`Error while getting programming languages `, err.message);
    	next(err);
	}
});

module.exports = router;