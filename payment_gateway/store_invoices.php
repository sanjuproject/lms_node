<?php 

// Include mpdf library file
require_once __DIR__ . '/vendor/autoload.php';
$mpdf = new \Mpdf\Mpdf();

$postdata = json_decode($_POST['invoice_body'],true);

// Take PDF contents in a variable
$pdfcontent = $postdata['content'];

$mpdf->WriteHTML($pdfcontent);

$mpdf->SetDisplayMode('fullpage');
$mpdf->list_indent_first_level = 0; 

//call watermark content and image
//$mpdf->SetWatermarkText('etutorialspoint');
//$mpdf->showWatermarkText = true;
//$mpdf->watermarkTextAlpha = 0.1;

//output in browser
$mpdf->Output('invoice.pdf','F');		
?>