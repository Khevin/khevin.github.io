<?php 
if(isset($_POST['submit'])){
    $to = "comercial@nelri.com.br"; // this is your Email address
    $from = $_POST['email']; // this is the sender's Email address
    $name = $_POST['name'];
    $subject = "Email de Contato - Website Nelri";
    $subject2 = "Copia de envio de formulario";
    $message = $name . " escreveu a seguinte mensagem:" . "\n\n" . $_POST['message'];
    $message2 = "Aqui está uma cópia de sua mensagem " . $name . "\n\n" . $_POST['message'];

    $headers = "De:" . $from;
    $headers2 = "De:" . $to;
    mail($to,$subject,$message,$headers);
    mail($from,$subject2,$message2,$headers2); // sends a copy of the message to the sender
    echo "Email enviado. Obrigado, " . $name . ", entraremos em contato em breve.";
    // You can also use header('Location: thank_you.php'); to redirect to another page.
    }
?>