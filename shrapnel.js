var Manager = function(rootElement, the_data){
	var o = this;
	o.keys = [];
	var keys = Object.keys(the_data);
	
	keys.forEach(function(key) {
		o.keys.push(key);
		var elements = [];
		var bind_elements = document.querySelectorAll(`${rootElement} [bind=${key}]`);
		bind_elements.forEach(function(vvv){
	  		elements.push(vvv);
	  		if (vvv.nodeName === 'INPUT'){
	  			vvv.addEventListener('keyup', function(e){
					if (this.value !== o[key.value]) {
						o[key].value = this.value;
					}
				});
	  		}
	  		else if (vvv.nodeName === 'SELECT'){
	  			vvv.addEventListener('change', function(e){
					if (this.value !== o[key].value){
						o[key].value = this.value;
					}
				});
	  		}
		});

		o[key] = new Field(the_data[key], elements);
	});	

	this.get_data = function (){
		var data = {};
		o.keys.forEach(function(v) {
			data[v] = o[v].value;
		});
		return data;
	}
};

class Field {

    constructor(initial_value, elements) {
        this._value = null;

        this.elements = elements;
        this.value = initial_value;	     
    }

    get value() {
        return this._value;
    }

    set value(new_value){
        this._value = new_value;
        this.elements.forEach(function(v){
	  		if (v.nodeName === 'INPUT' || v.nodeName === 'SELECT'){
	  			v.value = new_value;
	  		}
	  		else if (v.nodeName === 'SPAN'){
	  			v.innerText = new_value;
			}
	  	});
	}
}


