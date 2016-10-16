<?php

$con = mysqli_connect("localhost","ntua_public","123456","NTUA_SAMPLE_DB");
if (!$con)
  {
  die('Could not connect: ' . mysqli_error($con));
  }
mysqli_query($con,"SET NAMES 'utf8'");
mysqli_query($con,"SET CHARACTER SET 'utf8'");
$yearF=$_GET['yearFrom'];
$monthF=$_GET['monthFrom'];
$yearT=$_GET['yearTo'];
$monthT=$_GET['monthTo']; 
$column = $_GET['column'];

//$sql =  "SELECT * FROM ERGANH_DATA";
$sql =  "SELECT AA.NAME, AA.ESYE_ID, BB." .$column .
        " FROM (" . 
        " SELECT NAME, ESYE_ID" . 
        " FROM NOMOI_TABLE" . 
        " )AA" . 
        " LEFT JOIN (" . 
        " SELECT MONTH , YEAR, ESYE_ID, SUM( " . $column . " ) " . $column . 
        " FROM ERGANH_DATA WHERE MONTH >= " .$monthF . " AND YEAR >= " .$yearF. " AND MONTH <= " .$monthT . " AND YEAR <= " .$yearT . 
        " GROUP BY ESYE_ID " . 
        " )BB" .  
        " ON AA.ESYE_ID = BB.ESYE_ID"; 
$result = mysqli_query($con,$sql);

// Check result
// This shows the actual query sent to MySQL, and the error. Useful for debugging.
if (!$result) {
    $message  = 'Invalid query: ' . mysqli_error($con) . "\n";
    $message .= 'Whole query: ' . $sql;
    die($message);
    echo $message;
}

// Use result
// Attempting to print $result won't allow access to information in the resource
// One of the mysql result functions must be used
// See also mysql_result(), mysql_fetch_array(), mysql_fetch_row(), etc.
//$return = "";
//while ($row = mysqli_fetch_assoc($result)) {
//    $return = $return . "{\"ID\":\"", $row['ID'] ,"\",";
//    $return = $return . "\"MONTH\":\"", $row['MONTH'],"\",";
//    $return = $return . "\"YEAR\":\"", $row['YEAR'],"\",";
//    $return = $return . "\"NOMOS\":\"", $row['NOMOS'],"\",";
//    $return = $return . "\"E3_PROSL\":\"", $row['E3_PROSL'],"\",";
//    $return = $return . "\"E5_APOX\":\"", $row['E5_APOX'],"\"},";
//}
//header("Content-Type: application/json");
$rows = array();
while($r = mysqli_fetch_assoc($result)) {
    $rows[] = $r;
}
if(isset ($_GET['callback']))
{
    header("Content-Type: application/json");

    echo $_GET['callback']."(".json_encode($rows).")";

}
// echo json_encode( $rows );
// Free the resources associated with the result set
// This is done automatically at the end of the script
mysqli_free_result($result);

mysqli_close($con);
?> 