<?php

// Blank message to start with so we can append to it.
$message = '';

// ADICIONADO SUBMIT DE MENSAGEM - Check that name & email aren't empty.
if(empty($_POST['name']) || empty($_POST['email']) || empty($_POST['message'])){
    die('Confira se todos os campos foram preenchidos!');
}

// Check the checkbox
$checkString = 'I have not been checked.';
if(isset($_POST['checkme'])){
    $checkString = 'I have been checked.';
}

// Construct the message
$message .= <<<TEXT
    Name: {$_POST['name']}
    Email: {$_POST['email']}
    Message: {$_POST['message']}    
    {$checkString}
TEXT;

/* ANTIGO:
$message .= <<<TEXT
    Name: {$_POST['name']}
    Email: {$_POST['email']}
    Gender: {$_POST['gender']}
    Bacon: {$_POST['bacon']}    
    {$checkString}
TEXT;
*/

// Email to send to
$to = 'khevinm@gmail.com';

// Email Subject
$subject = 'Nova mensagem!';

// Name to show email from
$from = 'CONTATO KHEVIN.COM';

// Domain to show the email from
$fromEmail = 'Contato@khevin.com';

// Construct a header to send who the email is from
$header = 'From: ' . $from . '<' . $fromEmail . '>';

// Try sending the email
if(!mail($to, $subject, $message, $header)){
    die('Erro enviando email');
}else{
    die('Email enviado!');
}

?>

<!-- include your own success html here -->
 
 
 
Thank you for contacting us. We will be in touch with you very soon.
 
 
 
<?php
 
}
 
?>