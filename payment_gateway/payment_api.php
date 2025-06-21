<?php
 if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Methods: POST, GET, DELETE, PUT, PATCH, OPTIONS');
	header('Access-Control-Allow-Headers: token, Content-Type');
	header('Access-Control-Max-Age: 1728000');
	header('Content-Length: 0');
	header('Content-Type: text/plain');
	die();
}

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$ret = [
	'result' => 'OK',
];
?>

<?php include('Crypto.php')?>
<?php 
	include('db_config.php');
	$merchant_data='';
	//$working_key='E0129C0ADBF2B6CFD96B633D0B45D5C5';//Shared by CCAVENUES
	//$access_code='AVXS54KD63CA40SXAC';//Shared by CCAVENUES
	
	foreach ($_POST as $key => $value){
		if($key != "student_id"){
			if($key != 'tid' && $key != 'merchant_id'){
			$merchant_data.=$key.'='.$value.'&';
			}
		}
	}
	$merchant_data.='merchant_id='.$merchant_id.'&';
	$sql_cart_amout = "select * from `addtocart_subscription` where `student_id` = '".$_POST['student_id']."'";
	$result = $conn->query($sql_cart_amout);
	$total_cart_amount = 0;
	while($row = mysqli_fetch_array($result)){
		$total_cart_amount += $row['payment_amount'];
	}
	$conn->query("delete from interm_trans_data where `student_id` = '".$_POST['student_id']."'");

	$sql = "INSERT INTO `interm_trans_data`(`order_id`, `trans_id`, `student_id`, `cart_amount`) VALUES ('".$_POST['order_id']."','".$_POST['tid']."','".$_POST['student_id']."','".$total_cart_amount."')";

	$conn->query($sql);
	
	$encrypted_data=encrypt($merchant_data,$working_key); // Method for encrypting the data.
$responseary = array();
$responseary['status'] = 200;
$responseary['data']['encrypted_data'] = $encrypted_data;
$responseary['data']['access_code'] = $access_code;

echo json_encode($responseary);
die();
?>
<!--<form method="post" name="redirect" action="https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"> 
<?php
//echo "<input type=hidden name=encRequest value=$encrypted_data>";
//echo "<input type=hidden name=access_code value=$access_code>";
?>
</form>
</center>
<script language='javascript'>document.redirect.submit();</script>
</body>
</html>-->

