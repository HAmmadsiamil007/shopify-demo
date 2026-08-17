<?php
// Security: sanitize all inputs
$fname    = isset($_POST['fname'])    ? htmlspecialchars(strip_tags(trim($_POST['fname'])), ENT_QUOTES, 'UTF-8') : '';
$lname    = isset($_POST['lname'])    ? htmlspecialchars(strip_tags(trim($_POST['lname'])), ENT_QUOTES, 'UTF-8') : '';
$phone    = isset($_POST['phone'])    ? htmlspecialchars(strip_tags(trim($_POST['phone'])), ENT_QUOTES, 'UTF-8') : '';
$email    = isset($_POST['email'])    ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$address  = isset($_POST['address'])  ? htmlspecialchars(strip_tags(trim($_POST['address'])), ENT_QUOTES, 'UTF-8') : '';
$message  = isset($_POST['msg'])      ? htmlspecialchars(strip_tags(trim($_POST['msg'])), ENT_QUOTES, 'UTF-8') : '';
$nonce    = isset($_POST['_nonce'])   ? trim($_POST['_nonce']) : '';

// Simple CSRF check
session_start();
$expected_nonce = $_SESSION['aether_nonce'] ?? '';
if ($nonce !== $expected_nonce) {
    echo json_encode(array('status' => 'error', 'msg' => 'Security validation failed. Please reload the page.'));
    exit;
}

if (!empty($fname) && !empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL))
{
    $to_email = ""; // CONFIGURE: Set your receiving email address here
    $email_subject = "Inquiry From Contact Page";
    $vpb_message_body = nl2br("Dear Admin,\n
    The user whose detail is shown below has sent this message from ".$_SERVER['HTTP_HOST']." dated ".date('d-m-Y').".\n

    FirstName: ".$fname."\n
    LastName: ".$lname."\n
    Phone: ".$phone."\n
    Email Address: ".$email."\n
    Address: ".$address."\n
    Message: ".$message."\n

    Thank You!\n\n");

    $headers  = "From: AETHER Contact <noreply@".$_SERVER['HTTP_HOST'].">\r\n";
    $headers .= "Reply-To: ".$email."\r\n";
    $headers .= "Content-type: text/html; charset=utf-8\r\n";
    $headers .= "X-Mailer: PHP/AETHER\r\n";

    if (!empty($to_email) && @mail($to_email, $email_subject, $vpb_message_body, $headers)) {
        $status = 'Success';
        $output = "Thank you ".$fname.", your inquiry has been sent. Our team will be in touch shortly.";
    } else {
        $status = 'error';
        $output = "Sorry, your message could not be sent. Please try again later.";
    }
} else {
    $status = 'error';
    $output = "Please fill in all required fields with valid data.";
}

echo json_encode(array('status' => $status, 'msg' => $output));
?>