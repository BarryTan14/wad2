const readline = require('readline');
const { sendEmail } = require('./sendEmail');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser() {
  rl.question('Recipient email: ', (to) => {
    rl.question('Subject: ', (subject) => {
      rl.question('Email body (text): ', (text) => {
        rl.question('Email body (HTML): ', (html) => {
          sendEmail(to, subject, text, html)
            .then(() => {
              console.log('Email sent successfully!');
              rl.close();
            })
            .catch((error) => {
              console.error('Error sending email:', error);
              rl.close();
            });
        });
      });
    });
  });
}

console.log('Welcome to the Email Sender App!');
promptUser();