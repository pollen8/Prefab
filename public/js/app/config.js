define(function() {
 
  return {'elements': {
	  'field': {
		  label: 'Field',
		  tmpl : '<div class="control-group">' +
			    '<label class="control-label">Label</label>' +
			    '<div class="controls">' +
			        '<input type="text" name="" value="" class="" />' +
			    '</div>' +
			'</div>'},
	  'checkbox': {
		  label: 'Checkbox',
		  tmpl : '<div class="control-group"> ' +
			    '<label class="control-label">Label</label>' +
			    '<div class="controls">' +
			        '<label class="checkbox">' +
			            '<input type="checkbox" name="" value="" />' +
			            'Sub label' +
			        '</label>' +
			    '</div>' +
			'</div>'
			 },
	  'dropdown': {
		  label: 'Dropdown',
		  tmpl : '<div class="control-group"> ' +
	    '<label class="control-label">Label</label>' +
	    '<div class="controls">' +
	        '<select>' +
	            '<option value="">Sub label</option>' +
	        '</select>' +
	    '</div>' +
	'</div>'}
  }};
});

