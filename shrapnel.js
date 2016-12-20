var Shrapnel = function (rootID, the_data) {
    var rootElement = document.getElementById(rootID);

    //Returns the data to update the 2 way binding.
    this.data = the_data;

    //start bind from parent
    this.bind = function (rootel, data) {
        var manager = this;

        //BIND attribute the ones on in the element.
        manager.bindToElements(rootel, null, data);

        //LOOP attribute
        //look to see if there is any loop elements
        var loop_elements = rootel.querySelectorAll('[loop]');
        for (var x = 0; x < loop_elements.length; x++) {
            var vvv = loop_elements[x];
            if (closestWithAttribute(vvv.parentElement, 'loop') == null) {
                //if (vvv.parentElement.closest('[loop]') == null) {
                var key = vvv.getAttribute("loop");
                if (data[key] != undefined) {

                    //if there is a collection of objects.
                    var latestelement;
                    //clone the loop element for a template.
                    var looptemplate = vvv.cloneNode(true);
                    //console.log(looptemplate);
                    //add new functions, Add / Remove
                    //data[key].value.prototype = Object.getPrototypeOf(data[key].value);
                    //if (data[key].value.Add == undefined) data[key].value.prototype.Add = function (obj) { manager.bind(this.Template, obj); };
                    //if (data[key].value.Remove == undefined) data[key].value.prototype.Remove = function () { console.log('removed'); }
                    //if (data[key].value.Template == undefined) data[key].value.prototype.Template = looptemplate;

                    for (var i = 0; i < data[key].value.length; i++) {
                        var newelement;
                        //if its the first, use the template on the page, else create another loop template to use.
                        if (i == 0)
                            //use the first loop element
                            newelement = vvv;
                        else

                            newelement = looptemplate.cloneNode(true);

                        //remove the loop attribute so the app doesnt pick it up again while going through the elements.
                        newelement.removeAttribute('loop');

                        //bind the loop object to the element.
                        manager.bind(newelement, data[key].value[i]);
                        //if its not the first, create add the new one.                        

                        //if its a template
                        if (i != 0) {
                            vvv.parentNode.insertBefore(newelement, latestelement.nextSibling);
                        }
                        //remember last element to append the next one to.
                        latestelement = newelement;
                    };
                }
            }
        };
    }

    this.bindToElements = function (rootel, parentkey, data) {
        var manager = this;
        var keys;
        //if its a Field object(properties used on the page), else use the data object not converted.
        if (data.constructor == Field)
            keys = Object.keys(data.value);
        else
            keys = Object.keys(data);


        //go through each key in the object
        keys.forEach(function (key) {

            var elements = [];
            var searchkey = '';
            //if there's a parent key, build the searchkey to match it with the property name used in the bind attribute. 
            //Ex: Book.Cover.Type
            if (parentkey != null && parentkey != '') {
                searchkey = parentkey + '\\.' + key;
            }
            else {
                searchkey = key;
            }

            //bind to field class
            //if it's been set, append new elements to it.
            //get the property and replace it with a class that contains the data and the binded elements.

            if (data[key] != undefined && data[key].constructor != Field) {
                data[key] = new Field(data[key], []);
            }

            //if the property is an object, loop through this ones properties as well.
            if (typeof (data[key].value) == 'object' && !(data[key].value instanceof Array)) {

                //keep going lower by building parent key. and keep binding all properties if it is an object.
                //get property value
                manager.bindToElements(rootel, searchkey, data[key].value);
            }
            else if (typeof (data[key].value) == 'object' && (data[key].value instanceof Array)) {

                //console.log(key);
            }
                //if its a primitive property
            else {

                //get all elements with key and with a key object with property "."
                var bind_elements = rootel.querySelectorAll(`[bind=${searchkey}]`);
                for (var i = 0; i < bind_elements.length; i++) {
                    var vvv = bind_elements[i];
                    //if the property is found within a loop parent, skip.
                    if (closestWithAttribute(vvv, 'loop') == null) {
                        //if (vvv.closest('[loop]') == null) {
                        elements.push(vvv);
                        if ((vvv.nodeName === 'INPUT' && vvv.type == 'text') || vvv.nodeName == 'TEXTAREA') {
                            vvv.addEventListener('change', function (e) {
                                if (this.value !== data[key].value) {
                                    data[key].value = this.value;
                                }
                            });
                        }
                        else if (vvv.nodeName === 'INPUT' && vvv.type == 'checkbox') {
                            vvv.addEventListener('change', function (e) {
                                if (this.value !== data[key].value) {
                                    data[key].value = this.checked;
                                }
                            });
                        }
                        else if (vvv.nodeName === 'SELECT') {
                            vvv.addEventListener('change', function (e) {
                                if (this.value !== data[key].value) {
                                    data[key].value = this.value;
                                }
                            });
                        }
                    }
                };
                //String.prototype.replaceAll = function (str1, str2, ignore) { return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof (str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);}
                //replace {{}} if there are any.
                //RIGHT NOW IT GOES IN LOOPS AND HAVE NOT FOUND A WAY TO STOP IT.
                //also breaks elements. comment for now.
                //var replacekey = '{{' + replaceAll(searchkey, '\\\\', '') + '}}';
                //if (rootel.innerHTML.toLowerCase().indexOf(replacekey.toLowerCase()) > 0) {
                //    rootel.innerHTML = replaceAll(rootel.innerHTML, replacekey, data[key].value);
                //}
            }

            for (var y = 0; y < elements.length; y++) {
                //remove bind attribute.
                elements[y].removeAttribute('bind');
                data[key].addElement(elements[y]);
            }
        });
    }

    //Returns the initial updated object 
    this.getData = function () {
        //return the_data;
        //data to return.
        var returnCleanObject = function (d) {
            var data = {};
            //loop through all the properties.
            //if its an array of objects, loop through it
            if (typeof (d) == 'object') {
                Object.keys(d).forEach(function (k) {
                    var obj;
                    //if it's not a Field, it's because it wasn't bound so it was never converted to a field, return value.
                    if (d[k].constructor == Field) {
                        obj = d[k].value;

                    }
                    else {
                        obj = d[k];
                    }

                    //if obj is an array
                    if (obj instanceof Array) {
                        if (k == 'LotteryNumber') {
                            var i = '';
                        }
                        data[k] = [obj.length];
                        obj.forEach(function (d, i) {
                            data[k][i] = returnCleanObject(d);
                        });
                    }
                        //if the obj property is an object
                    else if (typeof (obj) == 'object') {
                        data[k] = returnCleanObject(obj);
                    }
                        //if obj is a primitive. 
                    else {
                        console.log(obj);
                        data[k] = obj;
                    }
                });
            }
            else
                data = d;
            return data;
        };

        return returnCleanObject(the_data);
    }
    var replaceAll = function (str, oldvalue, newvalue) {
        return str.replace(new RegExp((oldvalue), (true ? "gi" : "g")), newvalue);
    }
    //polyfill for closest()
    var closestWithAttribute = function (el, attr) {
        // Traverse the DOM up with a while loop

        //console.log(el.hasAttribute(attr));
        //if (el.parentNode == null) return null;

        while (!el.hasAttribute(attr)) {
            //if there is no more elements or it's the root, your out.
            if (!el || el == rootElement) {
                return null;
            }
            // Increment the loop to the parent node
            if (el.parentNode == null) return null;
            el = el.parentNode;


        }
        // At this point, the while loop has stopped and `el` represents the element that has
        // the class you specified in the second parameter of the function `attr`
        // Then return the matched element
        return el;
    }
    //function (el, attr) {
    //return el && (fn(el) ? el : closestWithAttribute(el.parentNode, function (el) { return (el.hasAttribute === attr); }));  
    //get the root element, start.
    this.bind(rootElement, the_data);
};

class Field {

    constructor(initial_value, elements) {
        this._value = null;
        this.elements = elements;
        this.value = initial_value;
        this.valueType = typeof (initial_value);
    }
    get value() {
        return this._value;
    }

    set value(new_value) {
        var obj = this;
        this._value = new_value;
        this.elements.forEach(function (v) {
            //console.log(v);
            obj.setElementValues(v);
        });
    }
    addElement(v) {
        this.elements.push(v);
        this.setElementValues(v);
    }
    setElementValues(v) {
        if (typeof (this.value) == 'object') {
            //console.log(v);
        }
        else if ((v.nodeName === 'INPUT' && v.type == 'text') || v.nodeName === 'SELECT' || v.nodeName == 'TEXTAREA') {
            v.value = this.value;
        }
        else if (v.nodeName === 'INPUT' && v.type == 'checkbox') {
            v.checked = this.value;
        }
        else if (v.nodeName === 'SPAN' || v.nodeName === 'LABEL') {
            v.innerText = this.value;
        }
    }
}


