/**
 * @TODO:
 * //////////////////////
 * V1: - create templates
 * //////////////////////
 * limit moving elements within the form
 * Save:
 *   * Open window to ask for tmpl name to save (or psudo list of existing tmpls)
 *   * Save tmpl via Ajax call (also needs to update the form's tmpl settings
 * Edit:
 *   * Toggle between form and details view templates
 *  Add :
 *   * buttons need to be available for  moving
 *   //////////////////////
 *   V2: - manage editing process
 *   //////////////////////
 * Edit:
 *   * Drag new elements into canvas
 *   * Icons for element plugins
 *   * Edit element properties (tab in dimensions window?)
 *   * In place editor for labels
 *  Delete:
 *   * remove elements via del button (with confirmation dialog)
 *  Add :
 *   * buttons need to be available for adding / removing
 *   * Manage form plug-ins 
 */


Fabrik.Prefab = new Class( {

	Implements : [ Options, Events ],

	options: {
		'plugins' : [],
		'observables': '.fabrikElementContainer'
	},

	initialize : function (id, options) {
		this.id = id;
		this.drags = $A([]);
		this.dragGroup = new Drag.Group({
			'filter': function (item) {
				return item.hasClass('activeEl');
			}
		});
		this.setOptions(options);
		this.activeEls = $H({});
		this.watchKeys();
		window.addEvent('domready', function () {
			this.makeInterface();
			this.watchToggle();
			this.makeDragElements();
			this.makeLayoutWindow();
			this.observefabrikElements();
			document.id('prefabSave').addEvent('click', this.save.bindWithEvent(this));
		}.bind(this));
		
		window.addEvent('fabrik.coordfield.changed', function (dir, value) {
			this.activeEls.each(function (el) {
				el.setStyle(dir, value + 'px');
			});
		}.bind(this));
		
		window.addEvent('fabrik.selector.up', function (coords) {
			console.log('fabrik.selector.up', coords);
			this.getObservables().each(function (e) {
				e.removeClass('possibleHighLight');
				if (e.inBounds(coords)) {
					var event = {'shift': true};
					this.activate(e, event); //shift select the element
				} else {
					console.log('deselecting', e);
				}
			}.bind(this));
		}.bind(this));
		
		
		window.addEvent('fabrik.selector.move', function (coords) {
			this.getObservables().each(function (e) {
				console.log(e, e.inBounds(coords));
				e.inBounds(coords) ? e.addClass('possibleHighLight') : e.removeClass('possibleHighLight');
			}.bind(this));
		}.bind(this));
		
		window.addEvent('fabrik.selector.clear', function (e) {
			if (!e.shift) {
				this.clearSelectedEls();
			}
		}.bind(this));
		
	},
	makeDragElements : function() {
		this.elementDragOpts = {
			'droppables': $$('.fabrikForm'),
			'onBeforeStart': function (drag) {
				var c = drag.clone().injectAfter(drag);
				c.makeDraggable(this.elementDragOpts)
			}.bind(this),
			'onEnter': function (drag, drop) {
				drop.addClass('dropActive')
			},
			'onLeave': function (drag, drop) {
				drop.removeClass('dropActive');
			},
			'onDrop': function (drag, drop, e) {
				e.stop();
				if (drop) {
					drop.removeClass('dropActive');
					// TODO this is still draggable - do we need to remove a class perhaps
					var ref = drag.retrieve('pluginref');
					console.log(ref);
					drag.set('html', this.options.elements[ref].drop);
					//this.detach();
				} else {
					drag.destroy();
				}
			}.bind(this),
			'onComplete': function (drag) {
				console.log('complete', this);
			}
		};
		
		document.getElements('.dragElement').makeDraggable(this.elementDragOpts);
	},		

	/**
	 * make the window which contains the controls for positioning elements
	 */

	makeLayoutWindow : function () {
		var c = 'width: <input name="width" size="3" /><br />' + 
		'height: <input name="height" size="3" /><br />' + 
		'left : <input name="left" size="3" /><br />' + 
		'top : <input name="top" size="3" /><br />';
		this.layoutWin = new Fabrik.Window({
			'id': 'prefabLayout',
			content: c,
			'createShowOverLay' : false
		});
		new Fabrik.PrefabCoordField('#prefabLayout input[name=left]', {'direction': 'left'});
		new Fabrik.PrefabCoordField('#prefabLayout input[name=top]', {'direction': 'top'});
	},

	/**
	 * watch all the fabrikElements so that clicking on them activates then
	 * within prefab.
	 */

	observefabrikElements : function() {
		this.getObservables().each(function (el) {
			el.addEvent('click', function (e) {
				/*if (!e.shift) {
					this.clearSelectedEls();
				}*/
				this.activate(el, e);
				e.stop();	
			}.bind(this));
		}.bind(this));
	},
	
	/**
	 * get an array of the elements which can be selected, moved etc
	 */
	
	getObservables : function () {
		return document.id(this.id).getElements(this.options.observables);
	},

	/**
	 * deselect all selected elements
	 */
	
	clearSelectedEls : function () {
		this.activeEls.each(function (el) {
			el.removeClass('activeEl');
		});
		this.activeEls = $H({});
	},
	
	/**
	 * activate an eleemnet
	 * @param element
	 * @param object event
	 */
	
	activate : function(el, e) {
		/*if (!e.shift) {
			this.clearSelectedEls();
		}*/
		console.log('activate', el.uniqueNumber, el, e);
		window.fireEvent('fabrik.prefab.activate', [el, e]);
		if (typeof(this.activeEls[el.uniqueNumber]) == 'undefined') {
			console.log('undefined so add', el);
			this.activeEls[el.uniqueNumber] = el;
		}
		var c = el.getParent('.fabrikForm');
		
		el.addClass('activeEl');
		
		this.dragGroup.add(el);
		
		var p = el.getCoordinates();
		var s = {
			'position': 'absolute',
			'top': p.top.toInt() + el.getStyle('margin-left').toInt(),
			'left': p.left.toInt(),
			'margin': 0
		};
		el.injectInside(document.body);
		el.setStyles(s);
	},
	
	stopDrag : function () {
		this.drags.stop();
	},

	watchKeys : function () {
		window.addEvent('keypress', function(e) {
			if (this.activeEls.length == 0) {
				return;
			}
			var l,t;
			shift = e.shift ? 9 : 0;
			this.activeEls.each(function (el) {
			var p = el.getCoordinates();
			switch (e.code) {
				case 37: // left
					l = p.left - 1 - shift;
					el.setStyle('left', l);
					if (this.activeEls.getLength() == 1) {
						window.fireEvent('fabrik.coordfield.update', ['left', l]);
					}
					e.stop();
					break;
				case 38: // up
					t = p.top - 0 - shift;
					el.setStyle('top', t);
					if (this.activeEls.getLength() == 1) {
						window.fireEvent('fabrik.coordfield.update', ['top', t]);
					}
					e.stop();
					break;
				case 39: // right
					l = p.left + 1 + shift;
					el.setStyle('left', l);
					if (this.activeEls.getLength() == 1) {
						window.fireEvent('fabrik.coordfield.update', ['left', l]);
					}
					e.stop();
					break;
				case 40: // down
					var t = p.top + 2 + shift;
					el.setStyle('top', t);
					if (this.activeEls.getLength() == 1) {
						window.fireEvent('fabrik.coordfield.update', ['top', t]);
					}
					e.stop();
					break;
				}
			}.bind(this));
		}.bind(this));
	},

	/**
	 * create the top pane from which you can drag down elements into the form
	 */

	makeInterface: function() {
		var plugins = [];
		console.log($H(this.options.plugins));
		this.options.plugins.each(function (el, x) {
			console.log(el);
			var drag = new Element('div', {'class': 'dragElement'}).set('text', el.label);
			drag.store('pluginref', x);
			plugins.push(new Element('li', {'id': el.id}).adopt(drag));
		});
		console.log(plugins);
		new Element('div', {
			'id': 'elementContainer'
		}).adopt( [
		new Element('a', {'href': '#', 'id': 'prefabSave'}).set('text', 'save'),        
		new Element('div', {
			'id': 'elementPluginList'
		}).adopt(new Element('ul').adopt(plugins)), new Element('div', {
			'id': 'toogleElementPluginList'
		}).adopt(new Element('a', {
			'href': '#'
		}).set('text', 'toggle'))
		

		]).inject(document.body);
		var w = this.options.elements.length * 80;
		document.id('elementPluginList').getElement('ul').setStyle('width', w + 'px');

	},

	watchToggle : function() {
		this.togglefx = new Fx.Morph(document.id('elementContainer'), {
			duration: 800,
			transition: Fx.Transitions.Quart.easeOut
		});
		document.id('toogleElementPluginList').getElement('a').addEvent('click', function (e) {
			e.stop();
			var top = document.id('elementContainer').getStyle('top').toInt() == 0 ? -90 : 0
			this.togglefx.start( {
				'top': top
			});
		}.bind(this))
	},
	
	save : function (e) {
		var pos = document.id(this.id).getPosition();
		var obs = this.getObservables();
		var css = '#' + this.id + '{position:relative}';
		obs.each(function (ob) {
			if (ob.hasClass('fabrikElement')) {
				var ref = '.' + ob.get('class').replace(' ', '.');
			} else {
				ref = '#'+ob.id;
			}
			var p = ob.getPosition();
			p.x = p.x - pos.x;
			p.y = p.y - pos.y;
			var w = ob.getWidth();
			var h = ob.getHeight();
			css += "\n";
			css += ref+'{position:absolute, left:' + p.x + 'px, top:' + p.y + 'px, width:' + w + 'px, height:' + h + 'px}';
		}.bind(this));
	}, 
	
	exportToBalsamiq : function () {
		var pos = $(this.id).getPosition();
		var obs = this.getObservables();
		var xml = '';
		//@todo make button for this option
		obs.each(function(ob, ref){
			if (ob.hasClass('fabrikLabel')) {
				var p = ob.getPosition();
				// @todo not sure if we need to remove pos from p?
				//console.log(pos, p);
				var w = ob.getWidth();
				var h = ob.getHeight();
				var id = ob.id.substring(0, ob.id.length -5);
				id = id.replace('fb_el_', '');//checkboxsearch___checkbox_text')
				xml += '<control controlID="'+ref+'" controlTypeID="com.balsamiq.mockups::Label" x="'+p.x+'" y="'+p.y+'" w="'+w+'" h="'+h+'" measuredW="'+w+'" measuredH="'+h+'" zOrder="'+ref+'" locked="false" isInGroup="-1">';
			 	xml += '<controlProperties>';
				 xml += '<customData/>';
				 xml += '<customID>'+id+'/L</customID>';
				 xml += '<text>'+ob.getText() + '</text>';
				 xml += '</controlProperties>';
				xml += '</control>';	
			}
		}.bind(this));
	}
})


Fabrik.CoordField = new Class( {

	Implements : [ Options, Events ],

	options : {
		'direction': 'left'
	},
	
	initialize : function (id, options) {
		this.setOptions(options);
		window.addEvent('domready', function (e) {
			this.field = document.getElement(id);
			this.field.addEvent('blur', function (e) {
				window.fireEvent('fabrik.coordfield.changed', [this.options.direction, this.field.value]);
			}.bind(this));
			this.field.addEvent('keypress', function (e) {
				shift = e.shift ? 9 : 0;
				e.stop();
				var dx = this.options.direction == 'top' ? -1 : 1;
				shift = shift * dx;
				switch (e.code) {
				case 38 ://up
					this.field.value = this.field.value.toInt() + dx + shift;
					window.fireEvent('fabrik.coordfield.changed', [this.options.direction, this.field.value]);
					break;
				case 40: //down
					this.field.value = this.field.value.toInt() - dx - shift;
					window.fireEvent('fabrik.coordfield.changed', [this.options.direction, this.field.value]);
					break;
				}
			}.bind(this));
		}.bind(this));
		
		window.addEvent('fabrik.coordfield.update', function (dir, value) {
			if (this.options.direction == dir) {
				this.field.value = value;
			}
		}.bind(this));
	}
	
});

Fabrik.PrefabCoordField = new Class( {
	Extends: Fabrik.CoordField,
	
	initialize : function (id, options) {
		this.parent(id, options);
		window.addEvent('fabrik.prefab.activate', function (el, e) {
			var p = el.getCoordinates();
			if (this.options.direction == 'left') {
				this.field.value = p.left;
			}
			if (this.options.direction == 'top') {
				this.field.value = p.top;
			}
		}.bind(this))
	}
});


/**
 * On mouse down creates a div which is used as a lasso.
 * On mouse up fires an event upon which other objects can act
 */

Selector = new Class({
	
	Implements : [ Options, Events ],

	options : {
		'upevent': 'fabrik.selector.up',
		'moveevent': 'fabrik.selector.move',
		'clearevent': 'fabrik.selector.clear',
		'className': 'selector',
		'selectorStyle': {'opacity':0.3, 'position':'absolute','background-color':'#3399ff', 'border':'1px dotted #0099ff'},
		'observables': '.fabrikElementContainer'
	},
	
	start: {x: 0, y: 0},

	initialize: function(options) {
		this.setOptions(options);
		this.active = false;
		window.addEvent('domready', function () {
			// array of elements which if the click down occurs over them dont start the selector
			// this is to all for element drag 
			this.observables = document.getElements(this.options.observables);
			this.select = new Element('div', {'class': this.options.className, styles: this.options.selectorStyle}).inject(document.body).hide();
		}.bind(this));
		
		window.addEvent('mousedown', function (e) {
			this.start = {x: e.event.pageX, y: e.event.pageY};
			var inbounds = this.observables.filter(function (o) {
				return o.mouseInside(this.start.x, this.start.y);
			}.bind(this));
			if (inbounds.length === 0) {
				// the click occured outside any observable element start the drag
				this.active = true;
				this.select.show();
			} else {
				//fire an event 
				//window.fireEvent(this.options.moveevent, coords);
			}
		}.bind(this));
		
		window.addEvent('mousemove', function (e) {
			if (this.active) {
				e.stop();
				this.select.show();
				this.setSelectorArea(e);
				var coords = this.getArea(e);
				window.fireEvent(this.options.moveevent, coords);
			}
		}.bind(this));
		
		window.addEvent('mouseup', function (e) {
			this.select.hide();
			if (e.rightClick) {
				return;
			}
			var coords = this.getArea(e); 
			if (this.active) {
				window.fireEvent('fabrik.selector.up', coords);
			}
			if (coords.top.x === coords.bottom.x && coords.top.y === coords.bottom.y) {
				console.log('clear event');
				window.fireEvent('fabrik.selector.clear', e);
			}
			this.active = false;
			this.start = {x: e.event.pageX, y: e.event.pageY};
			this.setSelectorArea(e);
		}.bind(this));
	},
	
	setSelectorArea : function(e) {
		var coords = this.getArea(e);
		var w = coords.bottom.x - coords.top.x;
		var h = coords.bottom.y - coords.top.y;
		this.select.setStyles({'width': w, 'height': h, 'left': coords.top.x, 'top': coords.top.y});
	},
	
	getArea : function(e){
		var l = e.event.pageX < this.start.x ? e.event.pageX : this.start.x;
		var r = e.event.pageX > this.start.x ? e.event.pageX : this.start.x;
		var t = e.event.pageY < this.start.y ? e.event.pageY : this.start.y;
		var b = e.event.pageY > this.start.y ? e.event.pageY : this.start.y;
		return {top: {x: l, y: t}, bottom: {x: r, y: b}};
	}
});