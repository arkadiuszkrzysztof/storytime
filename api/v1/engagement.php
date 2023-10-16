<?php
  include("../connection.php");
  include("../schema.php");

  $db = new dbObj();
  $connection =  $db->getConnstring();

  $request_method=$_SERVER["REQUEST_METHOD"];

  switch ($request_method) {
    case 'GET':
      if(!empty($_GET["engagementID"]))
      {
        $id=$_GET["engagementID"];
        get_engagement($id);
      }
      else if(!empty($_GET["storyID"]))
      {
        $id=$_GET["storyID"];
        get_engagements($id);
      }
      break;
    default:
      header("HTTP/1.0 405 Method Not Allowed");
      break;

    case 'PUT':
      $id=$_GET["engagementID"];
      update_engagement($id);
      break;
  }

  function get_engagements($id)
  {
    global $connection, $EngagementSchema;
    $query="SELECT {$EngagementSchema->ID}, {$EngagementSchema->LastUpdateHash}, {$EngagementSchema->LastUpdateTimestamp}, {$EngagementSchema->StoryID}, {$EngagementSchema->Response} FROM {$EngagementSchema->TableName} WHERE {$EngagementSchema->StoryID}='{$id}'";
    $response=array();
    $result=mysqli_query($connection, $query);
    while($row=mysqli_fetch_assoc($result))
    {
      $response[]=$row;
    }
    header('Content-Type: application/json');
    echo json_encode($response);
  }

  function get_engagement($id)
  {
    global $connection, $EngagementSchema;
    $query="SELECT {$EngagementSchema->ID}, {$EngagementSchema->LastUpdateHash}, {$EngagementSchema->LastUpdateTimestamp}, {$EngagementSchema->StoryID}, {$EngagementSchema->Response} FROM {$EngagementSchema->TableName} WHERE {$EngagementSchema->ID}='{$id}' LIMIT 1";

    $response=array();
    $result=mysqli_query($connection, $query);
    while($row=mysqli_fetch_assoc($result))
    {
      $response[]=$row;
    }
    header('Content-Type: application/json');
    echo json_encode($response);
  }

  function update_engagement($id)
  {
    global $connection, $EngagementSchema;

    $post_data = json_encode(file_get_contents("php://input"));
    $query="UPDATE {$EngagementSchema->TableName} SET {$EngagementSchema->Response}={$post_data} WHERE {$EngagementSchema->ID}='{$id}'";
    if(mysqli_query($connection, $query))
    {
      $response=array(
        'status' => 1,
        'status_message' =>'Employee Updated Successfully.'
      );
    }
    else
    {
      $response=array(
        'status' => 0,
        'status_message' =>'Employee Updation Failed.'
      );
    }
    header('Content-Type: application/json');
    echo json_encode($response);
  }
?>
