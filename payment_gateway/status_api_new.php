<?php include('Crypto.php')?>
<?php
$working_key = 'E0129C0ADBF2B6CFD96B633D0B45D5C5'; //Shared by CCAVENUES
$access_code = 'AVXS54KD63CA40SXAC';

$merchant_json_data =
array(
	'order_no' => '1683696211909',
	'reference_no' =>'312009621713'
);

$merchant_data = json_encode($merchant_json_data);

$final_data = 'enc_request='.$merchant_data.'&access_code='.$access_code.'&command=orderStatusTracker&request_type=JSON&response_type=JSON';

$encrypted_data = encrypt($merchant_data, $working_key);
$final_data = 'enc_request='.$encrypted_data.'&access_code='.$access_code.'&command=orderStatusTracker&request_type=JSON&response_type=JSON';

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "https://apitest.ccavenue.com/apis/servlet/DoWebTrans");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_VERBOSE, 1);
//curl_setopt($ch, CURLOPT_HTTPHEADER,'Content-Type: application/json') ;
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $final_data);

// Get server response ...
$result = curl_exec($ch);
curl_close($ch);

$status = '';
$information = explode('&', $result);

$dataSize = sizeof($information);
for ($i = 0; $i < $dataSize; $i++) {
	$info_value = explode('=', $information[$i]);
	if ($info_value[0] == 'enc_response') {
		$status = decrypt(trim($info_value[1]), $working_key);
		
	}
}

echo 'Status revert is: ' . $status.'<pre>';
$obj = json_decode($status);
print_r($obj);

?>

<?php
//ADD NEW ENCRYPT Function
/*
function encrypt($plainText,$key)
{
	$key = hextobin(md5($key));
	$initVector = pack("C*", 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f);
	$openMode = openssl_encrypt($plainText, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $initVector);
	$encryptedText = bin2hex($openMode);
	return $encryptedText;
}

function decrypt($encryptedText,$key)
{
	$key = hextobin(md5($key));
	$initVector = pack("C*", 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f);
	$encryptedText = hextobin($encryptedText);
	$decryptedText = openssl_decrypt($encryptedText, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $initVector);
	return $decryptedText;
}
	//*********** Padding Function *********************

function pkcs5_pad ($plainText, $blockSize)
{
	$pad = $blockSize - (strlen($plainText) % $blockSize);
	return $plainText . str_repeat(chr($pad), $pad);
}

	//********** Hexadecimal to Binary function for php 4.0 version ********

function hextobin($hexString) 
{ 
	$length = strlen($hexString); 
	$binString="";   
	$count=0; 
	while($count<$length) 
	{       
		$subString =substr($hexString,$count,2);           
		$packedString = pack("H*",$subString); 
		if ($count==0)
		{
			$binString=$packedString;
		} 
		
		else 
		{
			$binString.=$packedString;
		} 
		
		$count+=2; 
	} 
	return $binString; 
} */
?>
