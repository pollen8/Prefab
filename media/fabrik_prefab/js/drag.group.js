/**
 * taken from http://www.nwhite.net/2009/02/09/draggroup/
 * 
 */
Drag.Group = new Class({
 
	Implements : [Options],
 
	options : {
		'active' : true,
		'store' : 'drag-group-item',
		'filter' : $lambda(true),
		'drag' : {}
	},
 
	elements : [],
 
	initialize : function(options){
		this.setOptions(options);
	},
 
	add : function(el,options){
		var drag = new Drag.Group.Item(el, this, $merge(this.options.drag,options))
		el.store(this.options.store, drag );
		this.elements.push(el);
		return drag;
	},
 
	start : function(el,event){
		if(!this.options.active || !this.options.filter(el)) 
			el.retrieve(this.options.store).start(event,true);
		else {
			this.elements.filter(this.options.filter).each(function(match){
				match.retrieve(this.options.store).start(event,true);
			},this);
		}
	}
});
 
Drag.Group.Item = new Class({
 
	Extends : Drag.Move,
 
	initialize : function(el,group,options){
		this.group = group;
		this.parent(el,options);
	},
 
	start : function(event,alerted){
		if(alerted) this.parent(event);
		else this.group.start(this.element,event);
	}
 
});