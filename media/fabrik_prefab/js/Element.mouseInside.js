Element.implement({
	
	inBounds : function(bounds) {
		var c = this.getCoordinates();
		
		if ((c.left > bounds.top.x && c.left < bounds.bottom.x)){
			if(c.top > bounds.top.y && c.top < bounds.bottom.y) {
				return true;
			}
		}
		console.log(c, bounds);
		return false;
	},
	
	mouseInside: function(x, y) {
		var coords = this.getCoordinates();
		var elLeft = coords.left;
		var elRight =  coords.left + coords.width;
		var elTop = coords.top;
		var elBottom = coords.bottom;
		if( x >= elLeft && x <= elRight) {
			if( y >= elTop && y <= elBottom) {
				return true;
			}
		}
		return false;
	}
})