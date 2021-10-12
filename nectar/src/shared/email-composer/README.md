# Instructions

## nodemailer email data input:
```javascript
options: { to: 'example@gmail.com' };
type: 'emailType';
data: {
  attr1: 'something',
  attr2: 'somethin else',
};
```

The input "options" contains the email address to send the email.
The input "type" is the identificator of the mail. So the html file must have the same name (emailType.html) and "subjects" in "getSubject()" must have a property "emailType".
The input "data" contains all variables to inclide in the html file.
The html file will have properties assigned as "{{attr1}}".

## mailjet email data input:
```javascript
options: { to: 'example@gmail.com', templateId: 'mailjet_template_id ' }
options: { to: ['example1@gmail.com', 'example2@gmail.com'], templateId: 'mailjet_template_id ' };
type: 'emailType';
data: {
  attr1: 'something',
  attr2: 'somethin else',
};
```

The input "options" contains the email address to send the email.
The input "type" is the identificator of the mail. So the html file must have the same name (emailType.html) and "subjects" in "getSubject()" must have a property "emailType".
The input templateId is the mailjet template identificator to send an email built in mailjet app.
The input "data" contains all variables to inclide in the html file.
The html file will have properties assigned as "{{attr1}}".
The input "templateId" or "type" must be filled.
The input "templateId" has preference.
