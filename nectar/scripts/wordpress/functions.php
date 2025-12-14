/** 
 * CUSTOM CODE
 * Author: Jorge Martinez BAstida
 */
add_action( 'wp_footer', 'on_form_sent' );
 
function on_form_sent() {
?>
<script type="text/javascript">
document.addEventListener( 'wpcf7submit', function( event ) {
	if (!event || !event.detail || !event.detail.inputs || !event.detail.inputs.length) return;

  let formId = event.detail.contactFormId;
  if (formId !== 4591) return;

  var inputs = event.detail.inputs;
  var nameInput = inputs.find(function (input) { return input && input.name === 'first-name' });
  var emailInput = inputs.find(function (input) { return input && input.name === 'your-email' });
  var companyInput = inputs.find(function (input) { return input && input.name === 'your-company' });
  var acceptanceInput = inputs.find(function (input) { return input && input.name === 'acceptance-889' });
  if (!acceptanceInput || acceptanceInput.value.trim() !== "1") return;

  var origin = 'VW_FREE_TRIAL_WP';

  var data = { origin: origin };
  if (nameInput && nameInput.value) data.name = nameInput.value.trim();
  if (emailInput && emailInput.value) data.email = emailInput.value.trim();
  if (companyInput && companyInput.value) data.company = companyInput.value.trim();
  if (acceptanceInput && acceptanceInput.value) data.isTermsAccepted = acceptanceInput.value.trim() === "1";

  fetch('https://api.vidiwise.com/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
}, false );
</script>
<?php
}