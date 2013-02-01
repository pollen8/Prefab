
define(['app/config', 'app/lang', 'mootools', 'mootools-more'], function (config, lang) {
	
	// Class name for divs that are grid buildable
	var container = 'grid-builder';
	
	// Sortables class for drag and drop reordering
	var sorter = null;
	
	// Selector to get which dom elements are element containers
	var areaSelector = 'div.' + container + ' div.row-fluid > div';
	
	var areas = [];
	
	var dragging = false;
	
	var outside = function (event, element) {
		
		var c = element.getCoordinates();
		if (event.page.x < c.left) {
			return true;
		}
		if (event.page.x > c.right) {
			return true;
		}
		if (event.page.y < c.top) {
			return true;
		}
		if (event.page.y > c.bottom) {
			
			if (element.retrieve('addRowWidget') === event.target.getParent('.addRowWidget')) {
				return false;
			}
			return true;
		}
		return false;
	};
	
	document.addEvent('domready', function () {
		ini();
	});
	
	function ini () {
		sorter = new Sortables('.' + container, {
			'onStart': function () {
				console.log('on start');
				dragging = true;
				hideAllEditors();
			},
			'onComplete': function () {
				dragging = false;
			}
		});
		areas = document.getElements(areaSelector);
		hoverEditors();
		hoverEditorsAddDelete();
	}
	
	function buildAddInterface() {
		var html = '<ul class="nav nav-list">';
		html += ' <li class="nav-header"><i class="icon-plus-sign"></i> ' + lang.get('Add element') + '</li>';
		for (var key in config.elements) {
			el = config.elements[key];
			html += '<li><a href="#" data-element="' + key + '">' + lang.get(el.label) + '</a></li>';
		}
		html += ' <li class="divider"></li>';
		html += ' <li><a href="#" data-options="1"><i class="icon-cog"></i> ' + lang.get('Options') + '</a></li>';
		html += ' <li class="divider"></li>';
		html += ' <li><a href="#" data-remove="1"><i class="icon-minus-sign"></i> ' + lang.get('Delete') + '</a></li>';
		html += '</ul>';
		html += ' <li class="divider"></li>';
		return html;
	};
	
	function showEditor(area) {
		if (dragging) {
			return;
		}
		var addRowWidget = area.retrieve('addRowWidget');
		if (!addRowWidget) {
			var html = buildAddInterface();
			addRowWidget = new Element('div.addRowWidget.dropdown-menu').set('html', html);
			document.body.adopt(addRowWidget);
			addRowWidget.store('area', area);
			area.store('addRowWidget', addRowWidget);
		}
		addRowWidget.setStyle('width', area.getStyle('width'));
		addRowWidget.show();
		addRowWidget.position({relativeTo : area, 'position': 'centerBottom', 'edge': 'centerTop'});
	};
	
	/**
	 * Hide a given editor
	 * 
	 * @param  DOM node (spanX)
	 */
	function hideEditor(area) {
		var addRowWidget = area.retrieve('addRowWidget');
		if (addRowWidget) {
			addRowWidget.hide();
		}
	};
	
	/**
	 * Hide all the editors
	 */
	function hideAllEditors () {
		var editor = null;
		areas.each(function (area) {
			hideEditor(area);
		});
	}
	
	/**
	 * Show/hide and add/remove classes, for editor that appears under each element
	 * on rollover
	 */
	function hoverEditors() {
		window.addEvent('mousemove', function (event) {
			areas.each(function (area) {
				if (outside(event, area)) {
					 hideEditor(area);
				} else {
					if (typeOf(event.target.getParent('.addRowWidget')) !== 'element') {
					 	showEditor(area);
					}
				}
			})
		});
		
		window.addEvent('mouseenter:relay(' + areaSelector + ')', function (e, area) {
			area.addClass('focus');
			area.setStyle('cursor', 'move');
		});
		
		window.addEvent('mouseleave:relay(' + areaSelector + ')', function (e, area) {
			area.removeClass('focus');
		});
	}
	
	/**
	 * Relay mouse events for adding/deleteing elements into the form
	 */
	
	function hoverEditorsAddDelete() {
		document.addEvent('click:relay(a[data-remove])', function (e, target) {
			hideAllEditors();
			target.getParent('.addRowWidget').retrieve('area').destroy();
		});
		
		document.addEvent('click:relay(a[data-element])', function (e, target) {
			var field = target.get('data-element');
			var direction = target.get('data-direction');
			if (typeOf(direction) === 'null') {
				direction = 'under';
			}
			var activeArea = target.getParent('.addRowWidget').retrieve('area');
			var html = config.elements[field].tmpl;
			if (html) {
				switch (direction) {
				case 'under':
					var newArea = new Element('div.span12').set('html', html);
					var div = new Element('div.row-fluid').adopt(newArea);
					div.inject(activeArea.getParent('.row-fluid'), 'after');
					break;
				}
				areas.push(newArea);
				sorter.addItems(div);
			}
			hideAllEditors();
		});
	}
	

});