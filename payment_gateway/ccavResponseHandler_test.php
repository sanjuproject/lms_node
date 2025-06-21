<?php include('Crypto.php');

//$base_url_api = "https://lmsapi.clvdev.in";
//$base_url = "https://lms.schemaphic.co.in/";
//$base_url = "https://lms.clvdev.in/";
//$conn = new mysqli("localhost","new_user","oa2?Hi595","new_db");
include('db_config.php');
	error_reporting(0);
	
	$workingKey = $working_key;		//Working Key should be provided here.
	$encResponse=$_POST["encResp"];			//This is the response sent by the CCAvenue Server
	$rcvdString=decrypt($encResponse,$workingKey);		//Crypto Decryption used as per the specified working key.
	$order_status="";
	$decryptValues=explode('&', $rcvdString);
	
	$dataSize=sizeof($decryptValues);

	for($i = 0; $i < $dataSize; $i++) 
	{
		$information=explode('=',$decryptValues[$i]);
		if($i==3)	$order_status=$information[1];
	}
	$paymentdetails = array();
	for($i = 0; $i < $dataSize; $i++) 
	{
		$information=explode('=',$decryptValues[$i]);
		$paymentdetails[$information[0]] = $information[1];
	}
	$paymentdetails['billing_email'] = $_POST['billing_email'];
	$paymentdetails['billing_tel'] = $_POST['billing_tel'];
	$email = $paymentdetails['billing_email'];
	$mobile = $paymentdetails['billing_tel'];
	
	$sql = "select * from students where is_deleted = 0 and status = 1 and email = '".$email."' and mobile = $mobile";
	
	$result = $conn->query($sql);
	$student_id = 0;
	while($row = $result->fetch_assoc()) {
		$student_id = $row['id'];
	}
	$student_id = $_POST['student_id'];
	$paymentdetails['order_id'] = $_POST['order_id'];
	$paymentdetails['amount'] = $_POST['amount'];
	$paymentdetails['tracking_id'] = $_POST['tracking_id'];

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
	//if($order_status==="Success" && $trans_check_result_value == 1 && $payment_trans_result_value == 0 && $cartamountresultvalue['total_cart_amount'] == $paymentdetails['amount'])
	if(1)
	{
		
	$curl = curl_init();
	curl_setopt_array($curl, array(
	  CURLOPT_URL => $base_url_api.'/api/lms/subscribe/getcartstlist',
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


$curl = curl_init();
curl_setopt_array($curl, array(
  CURLOPT_URL => $base_url_api.'/api/lms/subscribe/purchased_subscription',
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

$sql = "delete from `addtocart_subscription` where `student_id` = $student_id";
$conn->query($sql);
$responseary = json_decode($response,true);
$conn->query("delete from `student_subscription_details` where `student_id` = $student_id");
$sql = "insert into `student_subscription_details`(`student_id`, `email`, `exam_unique_id`, `is_subscribe`, `is_subscribe_e_library`)
VALUES ('".$student_id."','".$responseary['email']."','".$responseary['exam_unique_id']."','".$responseary['is_subscribe']."','".$responseary['is_subscribe_e_library']."')";
$conn->query($sql);

$conn->query("INSERT INTO `payment_trasns_details` (`student_id`, `payment_trans_id`, `order_id`,
 `bank_ref_no`, `payment_mode`, `card_name`, `currency`, `amount`, `trans_date`) VALUES (".$student_id.",'".$paymentdetails['tracking_id']."',
 '".$paymentdetails['order_id']."','".$paymentdetails['bank_ref_no']."','".$paymentdetails['payment_mode']."',
 '".$paymentdetails['card_name']."','".$paymentdetails['currency']."','".$paymentdetails['amount']."','".$paymentdetails['trans_date']."')");

//echo $response;

header('Location:'.$base_url.'online-payment-success');

	}
	else if($order_status==="Aborted")
	{
		$conn->query("INSERT INTO `payment_trasns_details` (`student_id`, `payment_trans_id`, `order_id`,
 `bank_ref_no`, `payment_mode`, `card_name`, `currency`, `amount`, `trans_date`,`trans_status`) VALUES (".$student_id.",'".$paymentdetails['tracking_id']."',
 '".$paymentdetails['order_id']."','".$paymentdetails['bank_ref_no']."','".$paymentdetails['payment_mode']."',
 '".$paymentdetails['card_name']."','".$paymentdetails['currency']."','".$paymentdetails['amount']."','".$paymentdetails['trans_date']."',3)");
		//echo "<br>Thank you for shopping with us.We will keep you posted regarding the status of your order through e-mail";
		header('Location:'.$base_url.'online-payment-aborted');
	
	}
	else if($order_status==="Failure")
	{
		$conn->query("INSERT INTO `payment_trasns_details` (`student_id`, `payment_trans_id`, `order_id`,
 `bank_ref_no`, `payment_mode`, `card_name`, `currency`, `amount`, `trans_date`,`trans_status`) VALUES (".$student_id.",'".$paymentdetails['tracking_id']."',
 '".$paymentdetails['order_id']."','".$paymentdetails['bank_ref_no']."','".$paymentdetails['payment_mode']."',
 '".$paymentdetails['card_name']."','".$paymentdetails['currency']."','".$paymentdetails['amount']."','".$paymentdetails['trans_date']."',2)");
		//echo "<br>Thank you for shopping with us.However,the transaction has been declined.";
		header('Location:'.$base_url.'online-payment-failure');
	}
	else
	{
		$conn->query("INSERT INTO `payment_trasns_details` (`student_id`, `payment_trans_id`, `order_id`,
 `bank_ref_no`, `payment_mode`, `card_name`, `currency`, `amount`, `trans_date`,`trans_status`) VALUES (".$student_id.",'".$paymentdetails['tracking_id']."',
 '".$paymentdetails['order_id']."','".$paymentdetails['bank_ref_no']."','".$paymentdetails['payment_mode']."',
 '".$paymentdetails['card_name']."','".$paymentdetails['currency']."','".$paymentdetails['amount']."','".$paymentdetails['trans_date']."',4)");
		//echo "<br>Security Error. Illegal access detected";
		header('Location:'.$base_url.'online-payment-illegal-access');
	
	}
	//echo json_encode($result);
	//header("Location: https://admin.clvdev.in");

	/*if($order_status==="Success")
	{
		echo "<br>Thank you for shopping with us. Your credit card has been charged and your transaction is successful. We will be shipping your order to you soon.";
		
	}
	else if($order_status==="Aborted")
	{
		echo "<br>Thank you for shopping with us.We will keep you posted regarding the status of your order through e-mail";
	
	}
	else if($order_status==="Failure")
	{
		echo "<br>Thank you for shopping with us.However,the transaction has been declined.";
	}
	else
	{
		echo "<br>Security Error. Illegal access detected";
	
	}

	echo "<br><br>";

	echo "<table cellspacing=4 cellpadding=4>";
	for($i = 0; $i < $dataSize; $i++) 
	{
		$information=explode('=',$decryptValues[$i]);
	    	echo '<tr><td>'.$information[0].'</td><td>'.$information[1].'</td></tr>';
	}

	echo "</table><br>";
	echo "</center>";*/

?>
