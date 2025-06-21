<?php 
///////payment_from : 1 = Web, 2 = Mobile
include("db_config.php");
	error_reporting(0);
	$paymentdetails = array();
	$paymentdetails = json_decode($_POST['payment_details'],true);
	$email = $paymentdetails['billing_email'];
	$mobile = $paymentdetails['billing_tel'];
	$order_status = $paymentdetails['order_status'];
	$sql = "select * from students where is_deleted = 0 and status = 1 and email = '".$email."' and mobile = $mobile";
	
	$result = $conn->query($sql);
	$student_id = 0;
	while($row = $result->fetch_assoc()) {
		$student_id = $row['id'];
	}
$check_interm_trans_data = "select * from `interm_trans_data` where `order_id` = ".$paymentdetails['order_id']." and `cart_amount`=".$paymentdetails['amount']."";

$trans_check_result = $conn->query($check_interm_trans_data);

$trans_check_result_value = $trans_check_result->num_rows;

$check_payment_trans_data = "select * from `payment_trasns_details` where `order_id` = ".$paymentdetails['order_id']."";

$payment_trans_result = $conn->query($check_payment_trans_data);

$payment_trans_result_value = $payment_trans_result->num_rows;


$check_cart_amount = "select sum(cart_amount) as total_cart_amount from `addtocart_subscription`  where `student_id` = ".$student_id;
$check_cart_amount_result = $conn->query($check_cart_amount);
$cartamountresultvalue = $check_cart_amount_result->fetch_assoc();


$conn->query("delete from `interm_trans_data` where `student_id` = ".$student_id);

echo $order_status, $trans_check_result_value, $payment_trans_result_value, $cartamountresultvalue['total_cart_amount'], $paymentdetails['amount'];

	if($order_status == 'CHARGED' && $trans_check_result_value == 1 && $payment_trans_result_value == 0 && $cartamountresultvalue['total_cart_amount'] == $paymentdetails['amount'])
	//if(true)
	{
		
		$curl = curl_init();
	
		curl_setopt_array($curl, array(
		  CURLOPT_URL => $base_url_api.'/apiv2/lms/subscribe/getcartstlist',
		  CURLOPT_RETURNTRANSFER => true,
		  CURLOPT_ENCODING => '',
		  CURLOPT_MAXREDIRS => 10,
		  CURLOPT_TIMEOUT => 0,
		  CURLOPT_FOLLOWLOCATION => true,
		  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
		  CURLOPT_CUSTOMREQUEST => 'POST',
		  CURLOPT_POSTFIELDS =>'{
			"student_id":'.$student_id.'
		}',
		  CURLOPT_HTTPHEADER => array(
			'Content-Type: application/json'
		  ),
		));
		
		$response = curl_exec($curl);
		
		curl_close($curl);
	
	
		$responseary = array();
		$responseary = json_decode($response,true);
		$purchase_subscription_ary = array();
		$purchase_subscription_ary['student_id'] = $student_id;
		$purchase_subscription_ary['amount_paid'] = $paymentdetails['amount'];
		$purchase_subscription_ary['subscribtion_payment_trans_id'] = $paymentdetails['tracking_id'];
		$purchase_subscription_ary['order_id'] = $paymentdetails['order_id'];
		$purchase_subscription_ary['subscription_details'] = $responseary['data'];
	
		$purchase_subscription = json_encode($purchase_subscription_ary);

		////////
		//$purchase_subscription = '{"student_id":"48","amount_paid":199,"subscribtion_payment_trans_id":202445219487716,"order_id":"1711538861653","subscription_details":[{"id":501,"student_id":48,"exam_type_id":2,"class":10,"exam_category_id":1,"subscription_id":20,"no_set":"[]","no_module":1,"no_mock":0,"no_casestudy":0,"cart_amount":"199","payment_amount":"199","has_library":0,"only_elibrary":0,"for_purchase":0,"created_at":"2024-03-27T11:26:48.000Z","category":"SCHOLASTIC","category_short_code":"SCH","type_name":"","subject_name":"Mathematics","subject_id":39,"combo_subject_ids":[39]}]}';

		/////////
	
	$curl = curl_init();
	
	curl_setopt_array($curl, array(
	  CURLOPT_URL => $base_url_api.'/apiv2/lms/subscribe/purchased_subscription',
	  CURLOPT_RETURNTRANSFER => true,
	  CURLOPT_ENCODING => '',
	  CURLOPT_MAXREDIRS => 10,
	  CURLOPT_TIMEOUT => 0,
	  CURLOPT_FOLLOWLOCATION => true,
	  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	  CURLOPT_CUSTOMREQUEST => 'POST',
	  CURLOPT_POSTFIELDS =>$purchase_subscription,
	  CURLOPT_HTTPHEADER => array(
		'Content-Type: application/json'
	  ),
	));
	
	$response = curl_exec($curl);
	
	curl_close($curl);
	$responseary = json_decode($response,true);
	
$sql = "delete from `addtocart_subscription` where `student_id` = $student_id";
$conn->query($sql);

$conn->query("delete from `student_subscription_details` where `student_id` = $student_id");
$sql = "insert into `student_subscription_details`(`student_id`, `email`, `exam_unique_id`, `is_subscribe`, `is_subscribe_e_library`)VALUES ('".$student_id."','".$responseary['email']."','".$responseary['exam_unique_id']."','".$responseary['is_subscribe']."','".$responseary['is_subscribe_e_library']."')";
$conn->query($sql);

$conn->query("INSERT INTO `payment_trasns_details` (`student_id`, `payment_trans_id`, `order_id`,`bank_ref_no`, `payment_mode`, `card_name`, `currency`, `amount`, `trans_date`,`payment_from`) VALUES (".$student_id.",'".$paymentdetails['tracking_id']."','".$paymentdetails['order_id']."','".$paymentdetails['bank_ref_no']."','".$paymentdetails['payment_mode']."','".$paymentdetails['card_name']."','".$paymentdetails['currency']."','".$paymentdetails['amount']."','".$paymentdetails['trans_date']."',2)");

	}
	else if($order_status==="AUTHORIZATION_FAILED")
	{
		$conn->query("INSERT INTO `payment_trasns_details` (`student_id`, `payment_trans_id`, `order_id`,
 `bank_ref_no`, `payment_mode`, `card_name`, `currency`, `amount`, `trans_date`,`trans_status`,`payment_from`) VALUES (".$student_id.",'".$paymentdetails['tracking_id']."',
 '".$paymentdetails['order_id']."','".$paymentdetails['bank_ref_no']."','".$paymentdetails['payment_mode']."',
 '".$paymentdetails['card_name']."','".$paymentdetails['currency']."','".$paymentdetails['amount']."','".$paymentdetails['trans_date']."',3,2)");
		//echo "<br>Thank you for shopping with us.We will keep you posted regarding the status of your order through e-mail";

	
	}
	else if($order_status==="AUTHENTICATION_FAILED")
	{
		$conn->query("INSERT INTO `payment_trasns_details` (`student_id`, `payment_trans_id`, `order_id`,
 `bank_ref_no`, `payment_mode`, `card_name`, `currency`, `amount`, `trans_date`,`trans_status`,`payment_from`) VALUES (".$student_id.",'".$paymentdetails['tracking_id']."',
 '".$paymentdetails['order_id']."','".$paymentdetails['bank_ref_no']."','".$paymentdetails['payment_mode']."',
 '".$paymentdetails['card_name']."','".$paymentdetails['currency']."','".$paymentdetails['amount']."','".$paymentdetails['trans_date']."',2,2)");
		//echo "<br>Thank you for shopping with us.However,the transaction has been declined.";

	}
	else
	{
		$conn->query("INSERT INTO `payment_trasns_details` (`student_id`, `payment_trans_id`, `order_id`,
 `bank_ref_no`, `payment_mode`, `card_name`, `currency`, `amount`, `trans_date`,`trans_status`,`payment_from`) VALUES (".$student_id.",'".$paymentdetails['tracking_id']."',
 '".$paymentdetails['order_id']."','".$paymentdetails['bank_ref_no']."','".$paymentdetails['payment_mode']."',
 '".$paymentdetails['card_name']."','".$paymentdetails['currency']."','".$paymentdetails['amount']."','".$paymentdetails['trans_date']."',4,2)");
		//echo "<br>Security Error. Illegal access detected";
	
	}
?>
